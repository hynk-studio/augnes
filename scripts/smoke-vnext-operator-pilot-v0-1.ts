#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer, request as requestHttp } from "node:http";
import { createRequire } from "node:module";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import { createVNextOperatorContextUseReviewHandlersV01 } from "../app/api/vnext/operator/context-use-review/route";
import { createVNextOperatorHostRoundTripHandlerV01 } from "../app/api/vnext/operator/host-round-trip/route";
import { createVNextOperatorLaterResultHandlersV01 } from "../app/api/vnext/operator/later-result/route";
import { createVNextOperatorPacketHandoffHandlerV01 } from "../app/api/vnext/operator/packet-handoff/route";
import { createVNextOperatorProjectContinuityHandlerV01 } from "../app/api/vnext/operator/project-continuity/route";
import { createVNextOperatorSemanticReviewHandlersV01 } from "../app/api/vnext/operator/semantic-review/route";
import { createVNextOperatorSemanticTransitionHandlersV01 } from "../app/api/vnext/operator/semantic-transition/route";
import { createVNextLocalOperatorSessionHandlersV01 } from "../app/api/vnext/operator/session/route";
import {
  buildSemanticReviewLoopTaskContextPacketFixture,
  semanticReviewLoopMapperInputFixture,
  type SemanticReviewLoopProjectFixtureV01,
} from "../fixtures/vnext/protocol/semantic-review-loop-v0-1";
import {
  buildReviewDecisionV01,
  createEpisodeDeltaCandidateFingerprintV01,
  validateReviewDecisionAgainstEpisodeDeltaProposalV01,
  validateReviewDecisionV01,
} from "../lib/vnext/review-decision";
import {
  insertVNextCoreRecordV01,
  readVNextCoreRecordV01,
  type VNextCoreRecordEnvelopeV01,
} from "../lib/vnext/persistence/durable-semantic-store";
import {
  getOrCreateCanonicalProjectForLocalRootV01,
  getOrCreateDefaultWorkspaceIdentityV01,
  normalizeLocalProjectRootRefV01,
  rebindCanonicalProjectLocalRootV01,
} from "../lib/vnext/persistence/project-identity-registry";
import {
  selectActiveProjectV01,
  touchRecentProjectV01,
} from "../lib/vnext/persistence/project-lifecycle-registry";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "../lib/vnext/protocol-primitives";
import {
  TASK_CONTEXT_PACKET_ID_HEX_LENGTH_V01,
  buildTaskContextPacketHandoffHrefV01,
  decodeTaskContextPacketHandoffSlugV01,
  encodeTaskContextPacketHandoffSlugV01,
  isTaskContextPacketIdV01,
} from "../lib/vnext/task-context-packet-handoff";
import { buildContextUseReviewV01 } from "../lib/vnext/context-use-review";
import {
  buildRunReceiptV01,
  createRunReceiptFingerprintV01,
  deriveRunReceiptIdV01,
  validateRunReceiptV01,
} from "../lib/vnext/run-receipt";
import { buildTaskContextPacketV01 } from "../lib/vnext/task-context-packet";
import { assertNativeHostResultV01 } from "../lib/vnext/native-host/native-host-contract";
import {
  createDeterministicCodexAdapterV01,
  type DeterministicCodexAdapterObservationV01,
} from "../lib/vnext/native-host/deterministic-codex-adapter";
import { canonicalizeRepositoryRelativePathV01 } from "../lib/vnext/repository-relative-path";
import { admitStructuredRunReceiptV01 } from "../lib/vnext/persistence/structured-run-receipt-admission";
import {
  DirectNativeHostRoundTripErrorV01,
  runDirectNativeHostRoundTripV01,
} from "../lib/vnext/runtime/direct-native-host-round-trip";
import { projectVNextOperatorPilotContinuityV01 } from "../lib/vnext/runtime/operator-pilot-project-continuity";
import {
  recordVNextSemanticCommitAuthorizationInsideTransactionV01,
  type VNextSemanticCommitGateRecordV01,
  type VNextSemanticCommitPreviewV01,
} from "../lib/vnext/runtime/durable-semantic-transition";
import {
  VNEXT_LOCAL_OPERATOR_MAX_BODY_BYTES_V01,
  admitVNextLocalOperatorMutationV01,
  consumeVNextLocalOperatorBootstrapV01,
  issueVNextLocalOperatorBootstrapV01,
  openVNextLocalOperatorDatabaseV01,
  readVNextLocalOperatorCredentialFromRequestV01,
  readVNextLocalOperatorPilotConfigV01,
  readVNextLocalOperatorSessionHistoryV01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
} from "../lib/vnext/runtime/local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "../lib/vnext/runtime/local-runtime-clock";
import {
  createVNextOperatorPilotDecisionRequestFingerprintV01,
  createVNextOperatorPilotReviewDecisionSessionBasisRefV01,
  prepareVNextOperatorPilotReviewMaterialV01,
  readVNextOperatorPilotSemanticReviewV01,
  recordVNextOperatorPilotReviewDecisionV01,
  validateVNextOperatorPilotReviewDecisionProvenanceV01,
  type VNextOperatorPilotDecisionRequestV01,
  type VNextOperatorPilotReviewDetailV01,
} from "../lib/vnext/runtime/operator-pilot-review-material";
import {
  commitVNextOperatorPilotSemanticTransitionV01,
  createVNextOperatorPilotSemanticConfirmationBasisRefV01,
  prepareVNextOperatorPilotSemanticCommitPreviewV01,
  validateVNextOperatorPilotSemanticGateConfirmationProvenanceV01,
} from "../lib/vnext/runtime/operator-pilot-semantic-transition";
import { readVNextOperatorPilotProposalDurableLineageV01 } from "../lib/vnext/runtime/operator-pilot-workbench-lineage";
import { compileTaskContextPacketFromPersistedSemanticStateV01 } from "../lib/vnext/runtime/persisted-semantic-context-compiler";
import type { ContextUseReviewV01 } from "../types/vnext/context-use-review";
import type { EpisodeDeltaProposalV01 } from "../types/vnext/episode-delta-proposal";
import type { ReviewDecisionV01 } from "../types/vnext/review-decision";
import type { RunReceiptV01 } from "../types/vnext/run-receipt";
import type { StateTransitionReceiptV01 } from "../types/vnext/state-transition-receipt";
import type { TaskContextPacketV01 } from "../types/vnext/task-context-packet";
import type {
  NativeHostAdapterV01,
  NativeHostAutomationContextV01,
  NativeHostInvocationControlV01,
  NativeHostRequestV01,
  NativeHostResultV01,
  NativeHostStopRequestV01,
} from "../types/vnext/native-host-adapter";
import {
  migrateVNextDurableSemanticStoreV01,
  migrateVNextLocalOperatorSessionsV01,
} from "./db-migrations.mjs";

const SMOKE_VERSION = "vnext_operator_pilot_smoke.v0.1" as const;
const OPERATOR_WORKSPACE_UUID = "11111111-1111-4111-8111-111111111111";
const OPERATOR_PROJECT_UUID = "22222222-2222-4222-8222-222222222222";
const OPERATOR_WORKSPACE_ID = `workspace:${OPERATOR_WORKSPACE_UUID}`;
const OPERATOR_PROJECT_ID = `project:${OPERATOR_PROJECT_UUID}`;
const FOREIGN_PROJECT_ID = "project:33333333-3333-4333-8333-333333333333";
const EXPECTED_FULL_LOOP_ANCHORS = {
  review_decision_id: "review-decision:d3f94aa087cc900764c37822",
  review_decision_fingerprint:
    "sha256:637b06678caeac187a072ece94e7399feb69206821483e9300087683b2d65405",
  confirmation_digest:
    "sha256:fd522dc3049ffda1abfeb88b69594b156bfa18c3233b95aca548e6b9c75b5911",
  gate_id: "semantic-commit-gate:aaf974435805d0dbccc34b55",
  gate_fingerprint:
    "sha256:d3fe906a5b1af1d8b788e4fe1ad396d2c8cc4712b3d97b981f41b3dc74380e3b",
  transition_receipt_id: "state-transition-receipt:79dff5e4cd5e632615d38b43",
  transition_receipt_idempotency_key:
    "sha256:478cfa3f02a3cf0879ede688235e9b6cade3841c58acf4030994c4ed97be2a54",
  transition_receipt_fingerprint:
    "sha256:0d0e11edce44ccb00f245d11057e6622c59a81a9a967c3d21c09cc04c1a48baa",
  later_packet_id: "task-context-packet:ba120ba136e2a0c0b061239",
  later_packet_fingerprint:
    "sha256:133f5595e0dee65a25f6cbf6097a860a71a431d38f0e44a6095eef7a658c8455",
  later_run_receipt_id: "run-receipt:f139113b375dcd12a3f5f6e4",
  later_run_receipt_idempotency_key:
    "sha256:d024c19880d7dea138e90b285e603d0dbeb371d54006b2e5963082d67d73d29a",
  later_run_receipt_fingerprint:
    "sha256:9dea6d9d83d4915a07f0d09d0ccb5c285cfb34c882b7ba8e90a26ece9fc83e40",
  context_use_review_id: "context-use-review:edef08b84f159d0e4507feb2",
  context_use_review_fingerprint:
    "sha256:10b8327086796ad1601da999475a8c9ffbeb940c33ea82bb335a38803133ee67",
  full_loop_fingerprint:
    "sha256:18bf5235993fd3727a3542edfce97375b1ef190950e61c0e743b3860a26fe96b",
} as const;
const require = createRequire(import.meta.url);
const tempRoot = mkdtempSync(
  path.join(tmpdir(), "augnes-vnext-operator-pilot-v0-1-"),
);
const operatorProjectRoot = path.join(tempRoot, "operator-project-root");
const canonicalDbPath = path.join(tempRoot, "operator-pilot.db");
const migrationDbPath = path.join(tempRoot, "legacy-upgrade.db");
const recordKindMigrationDbPath = path.join(
  tempRoot,
  "populated-old-record-kind.db",
);
const crossSessionReplayDbPath = path.join(
  tempRoot,
  "cross-session-replay.db",
);
const schemaSql = readFileSync(
  path.join(process.cwd(), "lib", "db", "schema.sql"),
  "utf8",
);
const positiveCases: string[] = [];
const negativeCases: string[] = [];
const credentialMaterial = new Set<string>();
let networkGuard: ReturnType<typeof installZeroNetworkGuard> | null = null;
let finalSummary: Record<string, unknown> | null = null;
const browserFixtureTimeOffset = process.env
  .AUGNES_VNEXT_OPERATOR_PILOT_BROWSER_FIXTURE_DIR
  ? Date.now() -
    10 * 60 * 1000 -
    Date.parse("2026-07-11T09:20:00.000Z")
  : 0;

class ManualClock implements VNextLocalRuntimeClockV01 {
  private value: string;

  constructor(value: string, private readonly offset_ms = 0) {
    this.value = this.shift(value);
  }

  now(): string {
    return this.value;
  }

  set(value: string): void {
    this.value = this.shift(value);
  }

  private shift(value: string): string {
    return new Date(Date.parse(value) + this.offset_ms).toISOString();
  }
}

class DeterministicSecretSource implements VNextLocalOperatorSecretSourceV01 {
  private sequence = 1;

  bytes(size: number): Uint8Array {
    const seed = createHash("sha256")
      .update(`vnext-operator-pilot-smoke-secret:${this.sequence}`)
      .digest();
    this.sequence += 1;
    if (size <= seed.byteLength) return seed.subarray(0, size);
    const output = new Uint8Array(size);
    for (let index = 0; index < size; index += 1) {
      output[index] = seed[index % seed.byteLength];
    }
    return output;
  }
}

async function main(): Promise<void> {
try {
  const canonicalTempRoot = realpathSync(tempRoot);
  const operatingSystemTempRoot = realpathSync(tmpdir());
  assert(
    canonicalTempRoot.startsWith(`${operatingSystemTempRoot}${path.sep}`),
    "operator integration artifacts must stay inside an OS-temporary root",
  );
  pass("operator_integration_owns_os_temporary_root");
  initializeCanonicalDatabase();
  initializeCanonicalOperatorProjectScope();
  validateAdditiveAndRepeatedMigration();
  const protectedBefore = snapshotNonSessionRows(canonicalDbPath);

  networkGuard = installZeroNetworkGuard();
  const clock = new ManualClock(
    "2026-07-11T00:00:00.000Z",
    browserFixtureTimeOffset,
  );
  const secretSource = new DeterministicSecretSource();
  const environment = pilotEnvironment({
    workspaceId: OPERATOR_WORKSPACE_ID,
    projectId: OPERATOR_PROJECT_ID,
    operatorId: "operator:operator-pilot-smoke",
    databasePath: canonicalDbPath,
  });
  const handlers = createVNextLocalOperatorSessionHandlersV01({
    environment,
    clock,
    secret_source: secretSource,
  });

  await assertTransportAndDisabledRefusals({ handlers, environment });
  await assertCookieAndBootstrapRefusals({ handlers });

  const primary = issueBootstrap(environment, clock, secretSource);
  rememberCredentialMaterial(primary.bootstrap_token);
  const primaryBootstrap = await bootstrapThroughRoute(
    handlers,
    primary.bootstrap_token,
  );
  assert.equal(primaryBootstrap.response.status, 200);
  assertRouteSecurityHeaders(primaryBootstrap.response);
  assertCookieFlags(primaryBootstrap.setCookie);
  assertPublicResponseHasNoCredentials(
    primaryBootstrap.body,
    primary.bootstrap_token,
  );
  rememberCookie(primaryBootstrap.cookiePair);
  pass("one_time_bootstrap_accepted");
  pass("local_post_form_bootstrap_accepted");
  pass("http_only_same_site_strict_cookie_issued");
  pass("bootstrap_response_public_safe");

  const authenticated = await handlers.GET(
    localGetRequest({ cookie: primaryBootstrap.cookiePair }),
  );
  assert.equal(authenticated.status, 200);
  assertRouteSecurityHeaders(authenticated);
  assert.equal((await authenticated.json()).status, "authenticated");
  pass("valid_session_authenticated");

  const replay = await bootstrapThroughRoute(
    handlers,
    primary.bootstrap_token,
  );
  await expectRouteError(
    replay.response,
    409,
    "operator_bootstrap_consumed",
    "bootstrap_replay_rejected",
  );

  const rotated = rotateNonce(
    environment,
    clock,
    secretSource,
    primaryBootstrap.cookiePair,
  );
  rememberCookie(rotated.cookiePair);
  pass("action_nonce_rotated_atomically");
  await expectRouteError(
    await handlers.GET(
      localGetRequest({ cookie: primaryBootstrap.cookiePair }),
    ),
    409,
    "operator_action_nonce_invalid",
    "stale_action_nonce_rejected",
  );
  const rotatedAuthentication = await handlers.GET(
    localGetRequest({ cookie: rotated.cookiePair }),
  );
  assert.equal(rotatedAuthentication.status, 200);
  pass("rotated_action_nonce_authenticates");

  await assertForeignScopeRefusal({
    environment,
    clock,
    secretSource,
    cookiePair: rotated.cookiePair,
  });

  const revoked = issueBootstrap(environment, clock, secretSource);
  rememberCredentialMaterial(revoked.bootstrap_token);
  const revokedBootstrap = await bootstrapThroughRoute(
    handlers,
    revoked.bootstrap_token,
  );
  rememberCookie(revokedBootstrap.cookiePair);
  const logout = await handlers.POST(
    localPostRequest({
      body: { action: "logout" },
      cookie: revokedBootstrap.cookiePair,
    }),
  );
  assert.equal(logout.status, 200);
  assertRouteSecurityHeaders(logout);
  assert.match(logout.headers.get("set-cookie") ?? "", /Max-Age=0/);
  pass("explicit_logout_revokes_session");
  await expectRouteError(
    await handlers.GET(
      localGetRequest({ cookie: revokedBootstrap.cookiePair }),
    ),
    401,
    "operator_session_revoked",
    "revoked_session_rejected",
  );

  const concurrent = issueBootstrap(environment, clock, secretSource);
  rememberCredentialMaterial(concurrent.bootstrap_token);
  const concurrentBootstrap = await bootstrapThroughRoute(
    handlers,
    concurrent.bootstrap_token,
  );
  rememberCookie(concurrentBootstrap.cookiePair);
  const concurrentResponses = await Promise.all([
    handlers.POST(
      localPostRequest({
        body: { action: "logout" },
        cookie: concurrentBootstrap.cookiePair,
      }),
    ),
    handlers.POST(
      localPostRequest({
        body: { action: "logout" },
        cookie: concurrentBootstrap.cookiePair,
      }),
    ),
  ]);
  concurrentResponses.forEach(assertRouteSecurityHeaders);
  const concurrentStatuses = concurrentResponses.map((response) => response.status);
  assert.equal(
    concurrentStatuses.filter((status) => status === 200).length,
    1,
  );
  assert.equal(
    concurrentStatuses.filter((status) => status !== 200).length,
    1,
  );
  pass("concurrent_nonce_reuse_accepts_at_most_one");
  reject("concurrent_nonce_reuse_loser_rejected");

  const expiring = issueBootstrap(environment, clock, secretSource);
  rememberCredentialMaterial(expiring.bootstrap_token);
  const expiringBootstrap = await bootstrapThroughRoute(
    handlers,
    expiring.bootstrap_token,
  );
  rememberCookie(expiringBootstrap.cookiePair);
  clock.set("2026-07-11T08:00:00.000Z");
  await expectRouteError(
    await handlers.GET(
      localGetRequest({ cookie: expiringBootstrap.cookiePair }),
    ),
    401,
    "operator_session_expired",
    "expired_session_rejected",
  );

  const protectedAfter = snapshotNonSessionRows(canonicalDbPath);
  assert.deepEqual(protectedAfter, protectedBefore);
  pass("authentication_does_not_mutate_semantic_or_legacy_rows");

  const legacyBefore = snapshotLegacyRows(canonicalDbPath);
  clock.set("2026-07-11T09:00:00.000Z");
  const fullLoop = await assertFullOperatorLoop({
    environment,
    clock,
    secretSource,
    sessionHandlers: handlers,
  });
  assert.deepEqual(snapshotLegacyRows(canonicalDbPath), legacyBefore);
  pass("full_loop_does_not_mutate_legacy_proof_evidence_or_work_rows");

  for (const caseId of [
    "semantic_transition_exact_replay",
    "later_packet_compile_exact_replay",
    "later_result_exact_replay",
    "context_use_review_exact_replay",
  ]) {
    assert(positiveCases.includes(caseId), `missing exact replay case: ${caseId}`);
  }

  const browserFixtureExport =
    await exportOperatorPilotBrowserFixtureV01(fullLoop);

  assertBackupRestore(canonicalDbPath, fullLoop.anchors);

  assertNoPlaintextCredentialPersistence(canonicalDbPath);
  pass("plaintext_credentials_not_persisted");
  assert.equal(networkGuard.attempts.length, 0);
  pass("fetch_dns_socket_external_calls_zero");

  assertIntegrity(canonicalDbPath);
  assertIntegrity(migrationDbPath);
  pass("sqlite_integrity_check_passed");

  finalSummary = {
    smoke_version: SMOKE_VERSION,
    status: "pass",
    positive_case_count: positiveCases.length,
    negative_case_count: negativeCases.length,
    positive_cases: positiveCases,
    negative_cases: negativeCases,
    session_rows_written: countRows(
      canonicalDbPath,
      "vnext_local_operator_sessions",
    ),
    authentication_phase_semantic_and_legacy_row_delta: 0,
    full_loop_legacy_row_delta: 0,
    plaintext_credential_occurrences: 0,
    fetch_calls: 0,
    dns_calls: 0,
    socket_calls: 0,
    external_network_calls: 0,
    default_database_accessed: false,
    external_identity_authenticated: false,
    semantic_authority_granted: false,
    real_operator_decision_created: false,
    full_loop_fixture_only: true,
    full_loop_anchors: fullLoop.anchors,
    full_loop_proposal: fullLoop.proposal,
    generated_packet_handoff_href: fullLoop.handoffHref,
    browser_fixture_export: browserFixtureExport,
    loopback_http_request_count: fullLoop.loopbackHttpRequestCount,
    backup_restore: "exact_durable_records_and_integrity_preserved",
    enrolled_project_core_record_count: fullLoop.coreRecordCount,
    foreign_project_core_record_count: 0,
    review_did_not_mutate_semantic_state: true,
    packet_compilation_was_explicit: true,
    temp_database_cleanup: "pending_finally",
  };
} finally {
  networkGuard?.restore();
  rmSync(tempRoot, { recursive: true, force: true });
}

assert.equal(existsSync(tempRoot), false);
pass("temporary_database_and_side_files_removed");
assert(finalSummary);
finalSummary.positive_case_count = positiveCases.length;
finalSummary.positive_cases = positiveCases;
finalSummary.temp_database_cleanup = "pass";
process.stdout.write(`${JSON.stringify(finalSummary, null, 2)}\n`);
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "operator_pilot_smoke_failed";
  process.stderr.write(`operator_pilot_smoke_failed:${message}\n`);
  process.exitCode = 1;
});

function initializeCanonicalDatabase(): void {
  assert.equal(existsSync(canonicalDbPath), false);
  const db = new Database(canonicalDbPath);
  try {
    db.pragma("foreign_keys = ON");
    db.exec(schemaSql);
    const table = db.prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = 'vnext_local_operator_sessions'`,
    ).get();
    assert(table);
  } finally {
    db.close();
  }
  pass("canonical_temp_database_initialized");
}

function initializeCanonicalOperatorProjectScope(): void {
  mkdirSync(operatorProjectRoot, { recursive: true, mode: 0o700 });
  const db = new Database(canonicalDbPath, { fileMustExist: true });
  try {
    db.pragma("foreign_keys = ON");
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(db, {
      create_uuid: () => OPERATOR_WORKSPACE_UUID,
      now: () => "2026-07-11T00:00:00.000Z",
    });
    assert.equal(workspace.workspace_id, OPERATOR_WORKSPACE_ID);
    const registration = getOrCreateCanonicalProjectForLocalRootV01(
      db,
      {
        workspace_id: workspace.workspace_id,
        local_root: normalizeLocalProjectRootRefV01(operatorProjectRoot, {
          base_path: path.parse(operatorProjectRoot).root,
        }),
        display_name: "Operator Pilot Project",
      },
      {
        create_uuid: () => OPERATOR_PROJECT_UUID,
        now: () => "2026-07-11T00:00:00.000Z",
      },
    );
    assert.equal(registration.project.project_id, OPERATOR_PROJECT_ID);
    touchRecentProjectV01(db, {
      workspace_id: OPERATOR_WORKSPACE_ID,
      project_id: OPERATOR_PROJECT_ID,
      now: "2026-07-11T00:00:00.000Z",
    });
    selectActiveProjectV01(db, {
      workspace_id: OPERATOR_WORKSPACE_ID,
      project_id: OPERATOR_PROJECT_ID,
      now: "2026-07-11T00:00:00.000Z",
      expected_project_id: null,
      expected_revision: null,
    });
  } finally {
    db.close();
  }
  pass("operator_fixture_uses_canonical_active_project_and_bound_root");
}

function validateAdditiveAndRepeatedMigration(): void {
  const db = new Database(migrationDbPath);
  try {
    db.exec(
      `CREATE TABLE legacy_guard (id TEXT PRIMARY KEY, value TEXT NOT NULL);
       INSERT INTO legacy_guard (id, value) VALUES ('row', 'unchanged');`,
    );
    const first = migrateVNextLocalOperatorSessionsV01(db);
    assert.deepEqual(first.created_tables, ["vnext_local_operator_sessions"]);
    assert.deepEqual(first.created_indexes, [
      "idx_vnext_local_operator_sessions_scope_expiry",
    ]);
    pass("legacy_database_upgraded_additively");
    const second = migrateVNextLocalOperatorSessionsV01(db);
    assert.deepEqual(second.created_tables, []);
    assert.deepEqual(second.created_indexes, []);
    pass("operator_session_migration_repeat_is_noop");
    assert.deepEqual(
      db.prepare("SELECT id, value FROM legacy_guard").all(),
      [{ id: "row", value: "unchanged" }],
    );
    pass("legacy_rows_preserved_during_migration");
  } finally {
    db.close();
  }
  validatePopulatedOldRecordKindMigration();
}

async function assertFullOperatorLoop(input: {
  environment: NodeJS.ProcessEnv;
  clock: ManualClock;
  secretSource: DeterministicSecretSource;
  sessionHandlers: ReturnType<typeof createVNextLocalOperatorSessionHandlersV01>;
}): Promise<{
  anchors: Record<string, string>;
  proposal: { proposal_id: string; proposal_fingerprint: string };
  handoffHref: string;
  coreRecordCount: number;
  loopbackHttpRequestCount: number;
}> {
  const config = readVNextLocalOperatorPilotConfigV01(input.environment);
  const nativeReviewHandlers = createVNextOperatorSemanticReviewHandlersV01({
    environment: input.environment,
    clock: input.clock,
    secret_source: input.secretSource,
  });
  const nativeTransitionHandlers = createVNextOperatorSemanticTransitionHandlersV01({
    environment: input.environment,
    clock: input.clock,
    secret_source: input.secretSource,
  });
  const nativeHandoffHandler = createVNextOperatorPacketHandoffHandlerV01({
    environment: input.environment,
    clock: input.clock,
  });
  const nativeContinuityHandler = createVNextOperatorProjectContinuityHandlerV01({
    environment: input.environment,
    clock: input.clock,
  });
  const nativeResultHandlers = createVNextOperatorLaterResultHandlersV01({
    environment: input.environment,
    clock: input.clock,
    secret_source: input.secretSource,
  });
  const nativeContextReviewHandlers = createVNextOperatorContextUseReviewHandlersV01({
    environment: input.environment,
    clock: input.clock,
    secret_source: input.secretSource,
  });

  const loopback = await startOperatorPilotLoopbackHarness({
    session: input.sessionHandlers,
    semanticReview: nativeReviewHandlers,
    semanticTransition: nativeTransitionHandlers,
    packetHandoff: nativeHandoffHandler,
    projectContinuity: nativeContinuityHandler,
    laterResult: nativeResultHandlers,
    contextUseReview: nativeContextReviewHandlers,
  });
  const sessionHandlers = {
    GET: loopback.forward,
    POST: loopback.forward,
  };
  const reviewHandlers = {
    GET: loopback.forward,
    POST: loopback.forward,
  };
  const transitionHandlers = {
    GET: loopback.forward,
    POST: loopback.forward,
  };
  const handoffHandler = loopback.forward;
  const continuityHandler = loopback.forward;
  const resultHandlers = {
    GET: loopback.forward,
    POST: loopback.forward,
  };
  const contextReviewHandlers = {
    GET: loopback.forward,
    POST: loopback.forward,
  };

  try {

  const bootstrap = issueBootstrap(
    input.environment,
    input.clock,
    input.secretSource,
  );
  rememberCredentialMaterial(bootstrap.bootstrap_token);
  const exchange = await bootstrapThroughRoute(
    sessionHandlers,
    bootstrap.bootstrap_token,
  );
  assert.equal(exchange.response.status, 200);
  const jar = new RouteCookieJar();
  jar.setPair(exchange.cookiePair);
  pass("full_loop_session_bootstrapped");

  const fixtureProject: SemanticReviewLoopProjectFixtureV01 = {
    fixture_id: "operator-pilot-full-loop",
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    run_id: "run:operator-pilot-full-loop-source",
  };
  const priorPacket = buildSemanticReviewLoopTaskContextPacketFixture(
    fixtureProject,
  );
  const mapperInput = semanticReviewLoopMapperInputFixture(
    fixtureProject,
    priorPacket,
  );
  const preparationDb = openVNextLocalOperatorDatabaseV01(config);
  const prepared = (() => {
    try {
      return prepareVNextOperatorPilotReviewMaterialV01(preparationDb, {
        config,
        mapper_input: mapperInput,
        prior_packet: priorPacket,
      });
    } finally {
      preparationDb.close();
    }
  })();
  assert.equal(prepared.decision_created, false);
  assert.equal(prepared.transition_created, false);
  pass("repository_native_review_material_prepared_and_persisted");

  await expectRouteError(
    await reviewHandlers.GET(
      routeRequest("/api/vnext/operator/semantic-review", { method: "GET" }),
    ),
    401,
    "operator_session_cookie_missing",
    "semantic_review_unauthenticated_get_rejected",
  );
  const listResponse = await reviewHandlers.GET(
    routeRequest("/api/vnext/operator/semantic-review", {
      method: "GET",
      jar,
    }),
  );
  const listBody = await publicJson(listResponse);
  assert.equal(listResponse.status, 200);
  assert.equal(listBody.status, "proposal_list");
  assert.equal((listBody.proposals as unknown[]).length, 1);
  pass("semantic_workbench_proposal_list_read");

  const detailResponse = await reviewHandlers.GET(
    routeRequest("/api/vnext/operator/semantic-review", {
      method: "GET",
      jar,
      query: { proposal_id: prepared.proposal.proposal_id },
    }),
  );
  const detailBody = await publicJson(detailResponse);
  assert.equal(detailResponse.status, 200);
  const detail = detailBody.proposal as {
    proposal: typeof prepared.proposal;
    candidates: Array<{
      candidate: typeof prepared.proposal.proposed_deltas[number];
      candidate_fingerprint: string;
      pilot_admission: { decision_allowed: { accept: boolean } };
    }>;
    decisions: unknown[];
    durable_lineage: WorkbenchDurableLineageReadV01;
  };
  assertWorkbenchDurableLineageRead({
    detail,
    proposal: prepared.proposal,
    expected_status: "not_applied",
  });
  pass("workbench_lineage_explicitly_reports_not_applied");
  const selected = detail.candidates.find(
    (candidate) => candidate.pilot_admission.decision_allowed.accept,
  );
  assert(selected, "full loop needs one accept/create-admitted candidate");
  assert.equal(
    selected.candidate_fingerprint,
    createEpisodeDeltaCandidateFingerprintV01(selected.candidate),
  );
  pass("semantic_workbench_exact_candidate_detail_read");

  const decisionRequest = {
    proposal_id: prepared.proposal.proposal_id,
    proposal_fingerprint: prepared.proposal.integrity.fingerprint,
    candidate_id: selected.candidate.candidate_id,
    candidate_fingerprint: selected.candidate_fingerprint,
    decision: "accept" as const,
    rationale_summary:
      "Synthetic isolated smoke accepts one absent single-target candidate for explicit preview and confirmation.",
    revisit: null,
  };
  await expectRouteError(
    await reviewHandlers.POST(
      routeRequest("/api/vnext/operator/semantic-review", {
        method: "POST",
        jar,
        body: decisionRequest,
        origin: "http://localhost:3000",
      }),
    ),
    403,
    "same_origin_required",
    "semantic_decision_wrong_origin_rejected",
  );
  for (const forbiddenDecision of ["supersede", "retract"] as const) {
    await expectRouteError(
      await reviewHandlers.POST(
        routeRequest("/api/vnext/operator/semantic-review", {
          method: "POST",
          jar,
          body: { ...decisionRequest, decision: forbiddenDecision },
        }),
      ),
      400,
      "operator_pilot_decision_value_invalid",
      `pilot_${forbiddenDecision}_direct_post_rejected`,
    );
  }
  const decisionResponse = await reviewHandlers.POST(
    routeRequest("/api/vnext/operator/semantic-review", {
      method: "POST",
      jar,
      body: decisionRequest,
    }),
  );
  const decisionBody = await publicJson(decisionResponse);
  assert.equal(decisionResponse.status, 201, "decision insert over loopback HTTP");
  assert.equal(decisionBody.status, "inserted");
  jar.absorb(decisionResponse);
  const decision = decisionBody.decision as {
    decision_id: string;
    integrity: { fingerprint: string };
    requested_transition_intent: unknown;
  };
  assert(decision.requested_transition_intent);
  pass("authenticated_review_decision_inserted");

  const replayDecisionResponse = await reviewHandlers.POST(
    routeRequest("/api/vnext/operator/semantic-review", {
      method: "POST",
      jar,
      body: decisionRequest,
    }),
  );
  const replayDecisionBody = await publicJson(replayDecisionResponse);
  assert.equal(replayDecisionBody.status, "exact_replay");
  assert.equal(
    (replayDecisionBody.decision as typeof decision).decision_id,
    decision.decision_id,
  );
  jar.absorb(replayDecisionResponse);
  pass("review_decision_exact_replay");

  assertDecisionProvenanceCoverage({
    config,
    clock: input.clock,
    secretSource: input.secretSource,
    jar,
    proposal: prepared.proposal,
    decision: decisionBody.decision as ReviewDecisionV01,
    request: decisionRequest,
  });

  await assertCrossSessionDecisionReplayAndActionability({
    environment: input.environment,
    clock: input.clock,
    secretSource: input.secretSource,
    sourceJar: jar,
    proposal: prepared.proposal,
    priorDecision: decisionBody.decision as ReviewDecisionV01,
    request: decisionRequest,
  });

  const beforeRefresh = coreRecordCount(canonicalDbPath);
  for (let index = 0; index < 2; index += 1) {
    const refresh = await reviewHandlers.GET(
      routeRequest("/api/vnext/operator/semantic-review", {
        method: "GET",
        jar,
        query: { proposal_id: prepared.proposal.proposal_id },
      }),
    );
    assert.equal(refresh.status, 200);
    assert.equal(
      ((await publicJson(refresh)).proposal as { decision_count: number })
        .decision_count,
      1,
    );
  }
  assert.equal(coreRecordCount(canonicalDbPath), beforeRefresh);
  pass("browser_refresh_get_does_not_repeat_decision_post");

  const decisionBinding = {
    proposal_id: prepared.proposal.proposal_id,
    proposal_fingerprint: prepared.proposal.integrity.fingerprint,
    decision_id: decision.decision_id,
    decision_fingerprint: decision.integrity.fingerprint,
  };
  await expectRouteError(
    await transitionHandlers.GET(
      routeRequest("/api/vnext/operator/semantic-transition", {
        method: "GET",
        jar,
        query: {
          ...decisionBinding,
          proposal_fingerprint: `sha256:${"e".repeat(64)}`,
        },
      }),
    ),
    409,
    "operator_pilot_proposal_fingerprint_mismatch",
    "preview_wrong_proposal_fingerprint_rejected",
  );
  await expectRouteError(
    await transitionHandlers.GET(
      routeRequest("/api/vnext/operator/semantic-transition", {
        method: "GET",
        jar,
        query: {
          ...decisionBinding,
          decision_fingerprint: `sha256:${"f".repeat(64)}`,
        },
      }),
    ),
    404,
    "operator_pilot_decision_missing",
    "preview_wrong_decision_fingerprint_rejected",
  );
  const rowsBeforePreview = coreRecordCount(canonicalDbPath);
  const stalePreviewResponse = await transitionHandlers.GET(
    routeRequest("/api/vnext/operator/semantic-transition", {
      method: "GET",
      jar,
      query: decisionBinding,
    }),
  );
  const stalePreviewBody = await publicJson(stalePreviewResponse);
  jar.absorb(stalePreviewResponse);
  assert.equal(stalePreviewResponse.status, 200);
  assert.equal(coreRecordCount(canonicalDbPath), rowsBeforePreview);
  pass("semantic_commit_preview_writes_zero_rows");

  const refusedConfirmationRows = coreRecordCount(canonicalDbPath);
  const staleConfirmationDigest = (
    stalePreviewBody.preview as { confirmation_digest: string }
  ).confirmation_digest;
  await expectRouteError(
    await transitionHandlers.POST(
      routeRequest("/api/vnext/operator/semantic-transition", {
        method: "POST",
        jar,
        body: {
          action: "confirm",
          ...decisionBinding,
          confirmation_digest: `sha256:${"0".repeat(64)}`,
        },
      }),
    ),
    409,
    "operator_pilot_preview_binding_mismatch",
    "modified_confirmation_digest_rejected",
  );
  for (const [field, value] of [
    ["gate_ttl_ms", 60_000],
    ["authorized_applier_ref", { external_id: "caller-applier" }],
    ["current_state", { presence: "absent" }],
    ["after_state", { fingerprint: `sha256:${"1".repeat(64)}` }],
    ["confirmed_at", "2026-07-11T09:00:00.000Z"],
  ] as const) {
    await expectRouteError(
      await transitionHandlers.POST(
        routeRequest("/api/vnext/operator/semantic-transition", {
          method: "POST",
          jar,
          body: {
            action: "confirm",
            ...decisionBinding,
            confirmation_digest: staleConfirmationDigest,
            [field]: value,
          },
        }),
      ),
      400,
      "operator_pilot_transition_body_unknown_field",
      `confirmation_${field}_injection_rejected`,
    );
  }
  assert.equal(coreRecordCount(canonicalDbPath), refusedConfirmationRows);
  assert.equal(
    (
      await sessionHandlers.GET(
        routeRequest("/api/vnext/operator/session", {
          method: "GET",
          jar,
        }),
      )
    ).status,
    200,
  );
  pass("confirmation_refusals_write_zero_and_preserve_nonce");

  input.clock.set("2026-07-11T09:16:00.000Z");
  await expectRouteError(
    await transitionHandlers.POST(
      routeRequest("/api/vnext/operator/semantic-transition", {
        method: "POST",
        jar,
        body: {
          action: "confirm",
          ...decisionBinding,
          confirmation_digest: (
            stalePreviewBody.preview as { confirmation_digest: string }
          ).confirmation_digest,
        },
      }),
    ),
    409,
    "operator_pilot_transition_conflict",
    "expired_preview_confirmation_rejected",
  );

  input.clock.set("2026-07-11T09:17:00.000Z");
  const previewResponse = await transitionHandlers.GET(
    routeRequest("/api/vnext/operator/semantic-transition", {
      method: "GET",
      jar,
      query: decisionBinding,
    }),
  );
  const previewBody = await publicJson(previewResponse);
  jar.absorb(previewResponse);
  const preview = previewBody.preview as {
    confirmation_digest: string;
    intended_effects: unknown[];
    gate_ttl_ms: number;
  };
  assert.equal(preview.intended_effects.length, 1);

  assertGenericGateCommitBypassRejected({
    config,
    clock: input.clock,
    secretSource: input.secretSource,
    jar,
    proposal: prepared.proposal,
    decision: decisionBody.decision as ReviewDecisionV01,
    preview: previewBody.preview as VNextSemanticCommitPreviewV01,
  });

  const rowsBeforeConfirm = coreRecordCount(canonicalDbPath);
  const cookieBeforeConfirm = jar.header();
  const confirmResponse = await transitionHandlers.POST(
    routeRequest("/api/vnext/operator/semantic-transition", {
      method: "POST",
      jar,
      body: {
        action: "confirm",
        ...decisionBinding,
        confirmation_digest: preview.confirmation_digest,
      },
    }),
  );
  const confirmBody = await publicJson(confirmResponse);
  assert.equal(confirmResponse.status, 201, "gate insert over loopback HTTP");
  assert.equal(confirmBody.status, "inserted");
  jar.absorb(confirmResponse);
  assert.notEqual(
    jar.header(),
    cookieBeforeConfirm,
    "successful HTTP confirmation must rotate the cookie nonce",
  );
  assert.equal(coreRecordCount(canonicalDbPath), rowsBeforeConfirm + 1);
  const gate = confirmBody.gate_record as VNextSemanticCommitGateRecordV01;
  assert.equal(gate.confirmation_digest, preview.confirmation_digest);
  assert.equal(gate.operator_confirmation_basis_refs?.length, 1);
  assertGateProvenanceCoverage({
    config,
    proposal: prepared.proposal,
    decision: decisionBody.decision as ReviewDecisionV01,
    gate,
    requiredSessionId:
      gate.operator_confirmation_basis_refs![0]!.external_id,
  });
  pass("exact_confirmation_persists_gate_only");

  const confirmReplayPreviewResponse = await transitionHandlers.GET(
    routeRequest("/api/vnext/operator/semantic-transition", {
      method: "GET",
      jar,
      query: decisionBinding,
    }),
  );
  const confirmReplayPreviewBody = await publicJson(
    confirmReplayPreviewResponse,
  );
  jar.absorb(confirmReplayPreviewResponse);
  const confirmReplayResponse = await transitionHandlers.POST(
    routeRequest("/api/vnext/operator/semantic-transition", {
      method: "POST",
      jar,
      body: {
        action: "confirm",
        ...decisionBinding,
        confirmation_digest: (
          confirmReplayPreviewBody.preview as { confirmation_digest: string }
        ).confirmation_digest,
      },
    }),
  );
  const confirmReplayBody = await publicJson(confirmReplayResponse);
  assert.equal(confirmReplayResponse.status, 200);
  assert.equal(confirmReplayBody.status, "exact_replay");
  assert.equal(
    (confirmReplayBody.gate_record as VNextSemanticCommitGateRecordV01)
      .integrity.fingerprint,
    gate.integrity.fingerprint,
  );
  jar.absorb(confirmReplayResponse);
  pass("same_session_confirmation_exact_replay");

  input.clock.set("2026-07-11T09:18:00.000Z");
  const commitRequest = {
    action: "commit",
    ...decisionBinding,
    gate_record_id: gate.gate_record_id,
    gate_record_fingerprint: gate.integrity.fingerprint,
  };
  const refusedCommitRows = coreRecordCount(canonicalDbPath);
  for (const [field, value] of [
    ["current_state", { presence: "absent" }],
    ["after_state", { fingerprint: `sha256:${"2".repeat(64)}` }],
    ["applied_at", "2026-07-11T09:18:00.000Z"],
  ] as const) {
    await expectRouteError(
      await transitionHandlers.POST(
        routeRequest("/api/vnext/operator/semantic-transition", {
          method: "POST",
          jar,
          body: { ...commitRequest, [field]: value },
        }),
      ),
      400,
      "operator_pilot_transition_body_unknown_field",
      `commit_${field}_injection_rejected`,
    );
    const nonceCheck = await sessionHandlers.GET(
      routeRequest("/api/vnext/operator/session", {
        method: "GET",
        jar,
      }),
    );
    const nonceCheckBody = await nonceCheck.clone().json();
    assert.equal(
      nonceCheck.status,
      200,
      `commit ${field} refusal must preserve the action nonce: ${String(nonceCheckBody.error_code)}`,
    );
  }
  assert.equal(coreRecordCount(canonicalDbPath), refusedCommitRows);
  pass("commit_authority_injections_write_zero_and_preserve_nonce");
  const commitResponse = await transitionHandlers.POST(
    routeRequest("/api/vnext/operator/semantic-transition", {
      method: "POST",
      jar,
      body: commitRequest,
    }),
  );
  const commitBody = await publicJson(commitResponse);
  assert.equal(
    commitResponse.status,
    201,
    `transition apply over loopback HTTP: ${String(commitBody.error_code ?? commitBody.status)}`,
  );
  assert.equal(commitBody.status, "applied");
  jar.absorb(commitResponse);
  const receipt = commitBody.transition_receipt as StateTransitionReceiptV01;
  pass("operator_confirmed_transition_applied_atomically");

  await assertWorkbenchDurableLineageRoute({
    handlers: reviewHandlers,
    jar,
    proposal: prepared.proposal,
    expected_status: "applied_awaiting_packet",
    receipt,
  });
  pass("workbench_lineage_reports_applied_receipt_awaiting_packet");

  input.clock.set("2026-07-11T09:19:00.000Z");
  const commitReplayResponse = await transitionHandlers.POST(
    routeRequest("/api/vnext/operator/semantic-transition", {
      method: "POST",
      jar,
      body: commitRequest,
    }),
  );
  const commitReplayBody = await publicJson(commitReplayResponse);
  assert.equal(commitReplayBody.status, "exact_replay");
  assert.equal(
    (commitReplayBody.transition_receipt as typeof receipt)
      .transition_receipt_id,
    receipt.transition_receipt_id,
  );
  jar.absorb(commitReplayResponse);
  pass("semantic_transition_exact_replay");

  input.clock.set("2026-07-11T09:20:00.000Z");
  const compileRequest = {
    action: "compile",
    transition_receipt_id: receipt.transition_receipt_id,
    transition_receipt_fingerprint: receipt.integrity.fingerprint,
    prior_packet_id: priorPacket.packet_id,
    prior_packet_fingerprint: priorPacket.integrity.fingerprint,
  };
  const compileResponse = await transitionHandlers.POST(
    routeRequest("/api/vnext/operator/semantic-transition", {
      method: "POST",
      jar,
      body: compileRequest,
    }),
  );
  const compileBody = await publicJson(compileResponse);
  assert.equal(compileResponse.status, 201, "packet compile over loopback HTTP");
  assert.equal(compileBody.status, "inserted");
  jar.absorb(compileResponse);
  const laterPacket = compileBody.later_packet as TaskContextPacketV01;
  const accepted = laterPacket.selected_context.find(
    (entry) => entry.entry_kind === "accepted_state_ref",
  );
  assert(accepted?.external_ref && accepted.source_ref);
  assert.equal(isTaskContextPacketIdV01(laterPacket.packet_id), true);
  assert.equal(
    laterPacket.packet_id.slice("task-context-packet:".length).length,
    TASK_CONTEXT_PACKET_ID_HEX_LENGTH_V01,
  );
  const laterPacketSlug = encodeTaskContextPacketHandoffSlugV01(
    laterPacket.packet_id,
  );
  assert(laterPacketSlug);
  assert.equal(
    decodeTaskContextPacketHandoffSlugV01(laterPacketSlug),
    laterPacket.packet_id,
  );
  const laterPacketHandoffHref = buildTaskContextPacketHandoffHrefV01({
    packet_id: laterPacket.packet_id,
    packet_fingerprint: laterPacket.integrity.fingerprint,
  });
  assert.equal(
    laterPacketHandoffHref,
    `/workbench/semantic-review/packet-handoff/${laterPacketSlug}?packet_fingerprint=${encodeURIComponent(
      laterPacket.integrity.fingerprint,
    )}`,
  );
  pass("compiled_packet_uses_canonical_handoff_identity");
  pass("compiled_packet_generates_exact_project_home_handoff_href");
  pass("later_packet_compilation_is_explicit");

  await assertWorkbenchDurableLineageRoute({
    handlers: reviewHandlers,
    jar,
    proposal: prepared.proposal,
    expected_status: "packet_compiled_awaiting_result",
    receipt,
    packet: laterPacket,
    handoff_href: laterPacketHandoffHref!,
  });
  pass("workbench_lineage_reports_compiled_packet_awaiting_result");

  input.clock.set("2026-07-11T09:21:00.000Z");
  const compileReplayResponse = await transitionHandlers.POST(
    routeRequest("/api/vnext/operator/semantic-transition", {
      method: "POST",
      jar,
      body: compileRequest,
    }),
  );
  const compileReplayBody = await publicJson(compileReplayResponse);
  assert.equal(compileReplayBody.status, "exact_replay");
  jar.absorb(compileReplayResponse);
  pass("later_packet_compile_exact_replay");

  const handoffResponse = await handoffHandler(
    routeRequest("/api/vnext/operator/packet-handoff", {
      method: "GET",
      jar,
      query: {
        packet_id: laterPacket.packet_id,
        packet_fingerprint: laterPacket.integrity.fingerprint,
      },
    }),
  );
  const handoffBody = await publicJson(handoffResponse);
  assert.equal(handoffResponse.status, 200);
  assert.equal(handoffBody.status, "packet_handoff");
  assert.equal(handoffBody.handoff_is_execution, false);
  assertPublicResponseHasNoCredentials(handoffBody);
  pass("bounded_packet_handoff_read");
  await expectRouteError(
    await handoffHandler(
      routeRequest("/api/vnext/operator/packet-handoff", {
        method: "GET",
        jar,
        query: {
          packet_id: laterPacket.packet_id,
          packet_fingerprint: `sha256:${"f".repeat(64)}`,
        },
      }),
    ),
    409,
    "operator_pilot_packet_fingerprint_mismatch",
    "packet_handoff_wrong_fingerprint_rejected",
  );

  await assertDirectHostRoundTripCoverageV01({
    environment: input.environment,
    config,
    clock: input.clock,
    secret_source: input.secretSource,
    jar,
    packet: laterPacket,
    transition_receipt: receipt,
  });

  const resultReport = {
    input_version: "codex_result_report_input.v0.1",
    scope: "project:augnes",
    report_id: "codex-report:operator-pilot-full-loop-later-task",
    report_kind: "codex_validation_report",
    reported_at: addIsoMillisecondsV01(laterPacket.generated_at, 90_000),
    operator_actor_ref: config.operator_id,
    codex_claimed_summary:
      "Synthetic later task returned bounded candidate-only material after receiving the handoff.",
    observed_checks: ["npm run typecheck"],
    changed_files_summary: ["README.md"],
    source_refs: [
      laterPacket.packet_id,
      laterPacket.integrity.fingerprint,
      receipt.transition_receipt_id,
      receipt.integrity.fingerprint,
      accepted.entry_id,
      accepted.external_ref.external_id,
      accepted.source_ref,
    ],
  };
  const laterResultRequest = {
    packet_id: laterPacket.packet_id,
    packet_fingerprint: laterPacket.integrity.fingerprint,
    transition_receipt_id: receipt.transition_receipt_id,
    transition_receipt_fingerprint: receipt.integrity.fingerprint,
    run_id: "run:operator-pilot-full-loop-later-task",
    result_report: resultReport,
    packet_consumption: {
      reported_payload_use: "yes",
      cited_selected_context_entry_ids: [accepted.entry_id],
    },
  };
  input.clock.set("2026-07-11T09:22:00.000Z");
  const resultResponse = await resultHandlers.POST(
    routeRequest("/api/vnext/operator/later-result", {
      method: "POST",
      jar,
      body: laterResultRequest,
    }),
  );
  const resultBody = await publicJson(resultResponse);
  assert.equal(resultResponse.status, 201, "later result insert over loopback HTTP");
  assert.equal(resultBody.status, "inserted");
  assert.equal(resultBody.proposal_created, false);
  assert.equal(resultBody.transition_created, false);
  jar.absorb(resultResponse);
  const laterRun = resultBody.receipt as RunReceiptV01;
  pass("later_task_result_intake_persisted_run_receipt_only");

  await assertWorkbenchDurableLineageRoute({
    handlers: reviewHandlers,
    jar,
    proposal: prepared.proposal,
    expected_status: "later_result_recorded_awaiting_review",
    receipt,
    packet: laterPacket,
    later_result: laterRun,
    handoff_href: laterPacketHandoffHref!,
  });
  pass("workbench_lineage_reports_later_result_awaiting_review");

  input.clock.set("2026-07-11T09:23:00.000Z");
  const resultReplayResponse = await resultHandlers.POST(
    routeRequest("/api/vnext/operator/later-result", {
      method: "POST",
      jar,
      body: laterResultRequest,
    }),
  );
  assert.equal((await publicJson(resultReplayResponse)).status, "exact_replay");
  jar.absorb(resultReplayResponse);
  pass("later_result_exact_replay");
  await expectRouteError(
    await resultHandlers.POST(
      routeRequest("/api/vnext/operator/later-result", {
        method: "POST",
        jar,
        body: { ...laterResultRequest, run_id: "run:conflicting-result" },
      }),
    ),
    409,
    "operator_pilot_later_result_identity_conflict",
    "later_result_conflicting_replay_rejected",
  );

  const resultRefreshBefore = coreRecordCount(canonicalDbPath);
  for (let index = 0; index < 2; index += 1) {
    const response = await resultHandlers.GET(
      routeRequest("/api/vnext/operator/later-result", {
        method: "GET",
        jar,
        query: {
          packet_id: laterPacket.packet_id,
          packet_fingerprint: laterPacket.integrity.fingerprint,
        },
      }),
    );
    assert.equal(response.status, 200);
    assert.equal((await publicJson(response)).status, "later_result");
  }
  assert.equal(coreRecordCount(canonicalDbPath), resultRefreshBefore);
  pass("later_result_refresh_does_not_repeat_post");

  const contextReviewRequest = {
    later_packet_id: laterPacket.packet_id,
    later_packet_fingerprint: laterPacket.integrity.fingerprint,
    transition_receipt_id: receipt.transition_receipt_id,
    transition_receipt_fingerprint: receipt.integrity.fingerprint,
    later_task_run_receipt_id: laterRun.receipt_id,
    later_task_run_receipt_fingerprint: laterRun.integrity.fingerprint,
    usage: { presented: "yes", actually_used: "yes" },
    assessment: "helpful",
    corrections: {
      correction_count: 1,
      summaries: ["Clarify one synthetic compatibility note before future reuse."],
    },
    metrics: {
      wrong_context_correction_count: 1,
      repeated_explanation_estimate: 0,
      missing_critical_context_count: 0,
      context_refs_used_count: 1,
    },
    notes: [
      "Synthetic isolated review validates mechanics without claiming actual usefulness.",
    ],
  };
  input.clock.set("2026-07-11T09:24:00.000Z");
  const contextReviewResponse = await contextReviewHandlers.POST(
    routeRequest("/api/vnext/operator/context-use-review", {
      method: "POST",
      jar,
      body: contextReviewRequest,
    }),
  );
  const contextReviewBody = await publicJson(contextReviewResponse);
  assert.equal(
    contextReviewResponse.status,
    201,
    "context-use review insert over loopback HTTP",
  );
  assert.equal(contextReviewBody.status, "inserted");
  assert.equal(contextReviewBody.semantic_state_mutated, false);
  assert.equal(contextReviewBody.correction_proposal_created, false);
  jar.absorb(contextReviewResponse);
  const contextReview = contextReviewBody.review as ContextUseReviewV01;
  pass("context_use_review_persisted_without_semantic_mutation");

  const beforeLineageReads = snapshotDurableRows(canonicalDbPath);
  for (let index = 0; index < 2; index += 1) {
    await assertWorkbenchDurableLineageRoute({
      handlers: reviewHandlers,
      jar,
      proposal: prepared.proposal,
      expected_status: "reviewed",
      receipt,
      packet: laterPacket,
      later_result: laterRun,
      context_use_review: contextReview,
      handoff_href: laterPacketHandoffHref!,
    });
  }
  assert.deepEqual(snapshotDurableRows(canonicalDbPath), beforeLineageReads);
  pass("workbench_full_durable_lineage_get_and_refresh_write_zero_rows");

  await assertWorkbenchLineageFailClosedCoverage({
    environment: input.environment,
    config,
    proposal: prepared.proposal,
    prior_packet: priorPacket,
    receipt,
    packet: laterPacket,
    later_result: laterRun,
    context_use_review: contextReview,
  });

  input.clock.set("2026-07-11T09:25:00.000Z");
  const reviewReplayResponse = await contextReviewHandlers.POST(
    routeRequest("/api/vnext/operator/context-use-review", {
      method: "POST",
      jar,
      body: contextReviewRequest,
    }),
  );
  assert.equal((await publicJson(reviewReplayResponse)).status, "exact_replay");
  jar.absorb(reviewReplayResponse);
  pass("context_use_review_exact_replay");
  await expectRouteError(
    await contextReviewHandlers.POST(
      routeRequest("/api/vnext/operator/context-use-review", {
        method: "POST",
        jar,
        body: {
          ...contextReviewRequest,
          notes: ["Conflicting review payload under the same logical identity."],
        },
      }),
    ),
    409,
    "operator_pilot_context_use_review_conflict",
    "context_use_review_conflicting_replay_rejected",
  );

  const reviewReadResponse = await contextReviewHandlers.GET(
    routeRequest("/api/vnext/operator/context-use-review", {
      method: "GET",
      jar,
      query: {
        later_task_run_receipt_id: laterRun.receipt_id,
        later_task_run_receipt_fingerprint: laterRun.integrity.fingerprint,
      },
    }),
  );
  assert.equal(reviewReadResponse.status, 200);
  assert.equal((await publicJson(reviewReadResponse)).status, "context_use_review");
  pass("context_use_review_read_after_result");

  const continuityResponse = await continuityHandler(
    routeRequest("/api/vnext/operator/project-continuity", {
      method: "GET",
      jar,
    }),
  );
  const continuityBody = await publicJson(continuityResponse);
  assert.equal(continuityResponse.status, 200);
  assert.equal(continuityBody.status, "project_continuity");
  const continuity = continuityBody.continuity as {
    latest_compiled_packet: {
      packet_id: string;
      packet_fingerprint: string;
    } | null;
    latest_context_use_review_status: { review_id: string } | null;
  };
  assert.equal(continuity.latest_compiled_packet?.packet_id, laterPacket.packet_id);
  assert.equal(
    continuity.latest_compiled_packet &&
      buildTaskContextPacketHandoffHrefV01(continuity.latest_compiled_packet),
    laterPacketHandoffHref,
  );
  assert.equal(
    continuity.latest_context_use_review_status?.review_id,
    contextReview.review_id,
  );
  pass("project_home_continuity_projects_latest_reviewed_loop");

  const foreignEnvironment = {
    ...input.environment,
    AUGNES_VNEXT_OPERATOR_PROJECT_ID: FOREIGN_PROJECT_ID,
  };
  const foreignReviewHandlers = createVNextOperatorSemanticReviewHandlersV01({
    environment: foreignEnvironment,
    clock: input.clock,
  });
  const foreignHandoffHandler = createVNextOperatorPacketHandoffHandlerV01({
    environment: foreignEnvironment,
    clock: input.clock,
  });
  await expectRouteError(
    await foreignReviewHandlers.GET(
      routeRequest("/api/vnext/operator/semantic-review", {
        method: "GET",
        jar,
        query: { proposal_id: prepared.proposal.proposal_id },
      }),
    ),
    403,
    "operator_session_scope_mismatch",
    "foreign_project_full_loop_route_rejected",
  );
  await expectRouteError(
    await foreignHandoffHandler(
      routeRequest("/api/vnext/operator/packet-handoff", {
        method: "GET",
        jar,
        query: {
          packet_id: laterPacket.packet_id,
          packet_fingerprint: laterPacket.integrity.fingerprint,
        },
      }),
    ),
    403,
    "operator_session_scope_mismatch",
    "foreign_project_packet_handoff_rejected",
  );
  assert.equal(
    countProjectRows(
      canonicalDbPath,
      "vnext_core_records",
      config.workspace_id,
      FOREIGN_PROJECT_ID,
    ),
    0,
  );
  pass("second_project_remains_read_write_isolated");

  assertStaticBrowserSafetyMarkers();

  const logoutResponse = await sessionHandlers.POST(
    routeRequest("/api/vnext/operator/session", {
      method: "POST",
      jar,
      body: { action: "logout" },
    }),
  );
  assert.equal(logoutResponse.status, 200);
  jar.absorb(logoutResponse);
  pass("full_loop_logout_revokes_session");
  await expectRouteError(
    await continuityHandler(
      routeRequest("/api/vnext/operator/project-continuity", {
        method: "GET",
        jar,
      }),
    ),
    401,
    "operator_session_cookie_missing",
    "full_loop_post_logout_read_rejected",
  );
  const historicalDb = openVNextLocalOperatorDatabaseV01(config);
  try {
    const historical = readVNextOperatorPilotSemanticReviewV01(historicalDb, {
      config,
      proposal_id: prepared.proposal.proposal_id,
      authenticated_session_id: null,
    });
    const classification = historical.decision_history.find(
      (item) => item.decision.decision_id === decision.decision_id,
    );
    assert.equal(classification?.pilot_session_bound, true);
    assert.equal(classification?.pilot_actionable, false);
  } finally {
    historicalDb.close();
  }
  pass("historical_decision_remains_session_bound_after_later_revocation");

  const anchors = {
    review_decision_id: decision.decision_id,
    review_decision_fingerprint: decision.integrity.fingerprint,
    confirmation_digest: preview.confirmation_digest,
    gate_id: gate.gate_record_id,
    gate_fingerprint: gate.integrity.fingerprint,
    transition_receipt_id: receipt.transition_receipt_id,
    transition_receipt_idempotency_key: receipt.idempotency_key,
    transition_receipt_fingerprint: receipt.integrity.fingerprint,
    later_packet_id: laterPacket.packet_id,
    later_packet_fingerprint: laterPacket.integrity.fingerprint,
    later_run_receipt_id: laterRun.receipt_id,
    later_run_receipt_idempotency_key: laterRun.idempotency_key,
    later_run_receipt_fingerprint: laterRun.integrity.fingerprint,
    context_use_review_id: contextReview.review_id,
    context_use_review_fingerprint: contextReview.integrity.fingerprint,
  };
  const fullLoopFingerprint = `sha256:${createHash("sha256")
    .update(JSON.stringify(canonicalJson(anchors)))
    .digest("hex")}`;
  const anchoredLoop = {
    ...anchors,
    full_loop_fingerprint: fullLoopFingerprint,
  };
  if (process.env.AUGNES_VNEXT_OPERATOR_PILOT_BROWSER_FIXTURE_DIR) {
    pass("full_loop_browser_fixture_anchors_are_fresh_and_self_describing");
  } else {
    assert.deepEqual(anchoredLoop, EXPECTED_FULL_LOOP_ANCHORS);
    pass("full_loop_fixed_anchors_unchanged");
  }
  assertOperatorLoopbackRouteCoverage(loopback.requests);
  return {
    anchors: anchoredLoop,
    proposal: {
      proposal_id: prepared.proposal.proposal_id,
      proposal_fingerprint: prepared.proposal.integrity.fingerprint,
    },
    handoffHref: laterPacketHandoffHref!,
    coreRecordCount: coreRecordCount(canonicalDbPath),
    loopbackHttpRequestCount: loopback.requests.length,
  };
  } finally {
    await loopback.close();
  }
}

async function assertDirectHostRoundTripCoverageV01(input: {
  environment: NodeJS.ProcessEnv;
  config: VNextLocalOperatorPilotConfigV01;
  clock: ManualClock;
  secret_source: DeterministicSecretSource;
  jar: RouteCookieJar;
  packet: TaskContextPacketV01;
  transition_receipt: StateTransitionReceiptV01;
}): Promise<void> {
  const policyContext = directHostPolicyContextV01(
    addIsoMillisecondsV01(input.packet.generated_at, 70_000),
  );
  const observations: DeterministicCodexAdapterObservationV01[] = [];
  input.clock.set("2026-07-11T09:21:10.000Z");
  const adapter = createDeterministicCodexAdapterV01({
    now: () => input.clock.now(),
    observe: (observation) => observations.push(observation),
  });
  const db = openVNextLocalOperatorDatabaseV01(input.config);
  let golden;
  try {
    const receiptsBefore = countRowsByKind(db, "run_receipt");
    golden = await runDirectNativeHostRoundTripV01(
      db,
      {
        config: input.config,
        mode: "policy_triggered",
        automation_context: policyContext,
      },
      { adapter, now: () => input.clock.now() },
    );
    assert.equal(golden.status, "inserted");
    assert.equal(golden.host_result?.outcome, "completed");
    assert.equal(countRowsByKind(db, "run_receipt"), receiptsBefore + 1);
    assert.equal(validateRunReceiptV01(golden.receipt).status, "valid");
    assert.equal(golden.receipt.workspace_id, input.config.workspace_id);
    assert.equal(golden.receipt.project_id, input.config.project_id);
    assert.equal(
      golden.receipt.task_context_packet_ref?.external_id,
      input.packet.packet_id,
    );
    assert.equal(
      golden.receipt.task_context_packet_ref?.source_ref,
      input.packet.integrity.fingerprint,
    );
    assert.equal(
      golden.receipt.source_refs.some(
        (ref) =>
          ref.ref_type === "state_transition_receipt" &&
          ref.external_id === input.transition_receipt.transition_receipt_id &&
          ref.source_ref === input.transition_receipt.integrity.fingerprint,
      ),
      true,
    );
    assert.equal(
      golden.receipt.source_refs.some(
        (ref) =>
          ref.ref_type === "project_root_scope" &&
          /^sha256:[a-f0-9]{64}$/.test(ref.source_ref ?? ""),
      ),
      true,
    );
    assert.equal(golden.receipt.model_invocations.length, 0);
    assert.equal(golden.receipt.privacy_egress.egress_status, "did_not_occur");
    assert.equal(golden.receipt.privacy_egress.raw_prompt_persisted, false);
    assert.equal(golden.receipt.privacy_egress.raw_output_persisted, false);
    assert.equal(golden.receipt.privacy_egress.raw_transcript_persisted, false);
    assert.equal(golden.receipt.privacy_egress.secret_material_persisted, false);
    assert.equal(golden.receipt.authority_summary.closes_work, false);
    assert.equal(golden.receipt.authority_summary.receipt_is_approval, false);
    assert.equal(golden.receipt.authority_summary.receipt_is_proof, false);
    assert.equal(
      golden.receipt.authority_summary.receipt_is_accepted_evidence,
      false,
    );
    assert.equal(
      golden.receipt.authority_summary.performs_durable_transition,
      false,
    );
    assert.equal(golden.packet_copy_actions, 0);
    assert.equal(golden.handoff_paste_actions, 0);
    assert.equal(golden.result_paste_actions, 0);
    assert.equal(golden.internal_id_entry_actions, 0);
    const receiptJson = canonicalizeProtocolValueV01(golden.receipt);
    assert.equal(receiptJson.includes(operatorProjectRoot), false);
    for (const forbidden of credentialMaterial) {
      assert.equal(receiptJson.includes(forbidden), false);
    }
    const runRow = db
      .prepare(
        `SELECT status, metadata_json FROM autonomy_runs WHERE run_id = ?`,
      )
      .get(golden.run_id) as { status: string; metadata_json: string };
    assert.equal(runRow.status, "completed");
    assert.equal(runRow.metadata_json.includes(operatorProjectRoot), false);
    assert.equal(runRow.metadata_json.includes(input.packet.task.goal), false);
    assert.equal(runRow.metadata_json.includes("run_receipt_id"), true);

    const replay = await runDirectNativeHostRoundTripV01(
      db,
      {
        config: input.config,
        mode: "policy_triggered",
        automation_context: policyContext,
      },
      { adapter, now: () => input.clock.now() },
    );
    assert.equal(replay.status, "exact_replay");
    assert.equal(replay.receipt.receipt_id, golden.receipt.receipt_id);
    assert.equal(replay.host_result, null);
    assert.equal(observations.length, 1);

    const sharedReplay = admitStructuredRunReceiptV01(db, golden.receipt);
    assert.equal(sharedReplay.status, "exact_replay");
    const conflicting = structuredClone(golden.receipt);
    conflicting.result_summary.summary =
      "Conflicting material under a stale receipt fingerprint.";
    assert.throws(
      () => admitStructuredRunReceiptV01(db, conflicting),
      /structured_run_receipt_invalid/,
    );
  } finally {
    db.close();
  }
  assert.equal(observations.length, 1);
  const observed = observations[0]!.request;
  assert.equal(observed.mode, "policy_triggered");
  assert.equal(observed.workspace_id, input.config.workspace_id);
  assert.equal(observed.project_id, input.config.project_id);
  assert.equal(observed.packet.packet_id, input.packet.packet_id);
  assert.equal(
    observed.packet.integrity.fingerprint,
    input.packet.integrity.fingerprint,
  );
  assert.equal(
    canonicalizeProtocolValueV01(observed.packet),
    canonicalizeProtocolValueV01(input.packet),
  );
  assert.equal(
    canonicalizeProtocolValueV01(observed.work_ref),
    canonicalizeProtocolValueV01(input.packet.work_ref),
  );
  assert.equal(
    observed.packet_lineage.source_transition_receipt_ref.external_id,
    input.transition_receipt.transition_receipt_id,
  );
  assert.equal(observed.root_scope.canonical_root, operatorProjectRoot);
  assert.equal(observed.root_scope.root_kind, "plain_folder");
  assert.equal(observed.root_scope.repository_ref, null);
  assert.equal(observed.root_scope.selected_worktree_ref, null);
  assert.equal(observed.automation_context?.scheduler_started, false);
  assert.equal(observed.automation_context?.automatic_retry_allowed, false);
  assert.equal(observed.result_return.legacy_result_text_allowed, false);
  assert.equal(observed.result_return.raw_output_allowed, false);
  assert.equal(observed.policy.network, "forbidden");
  assert.equal(observed.policy.model, "forbidden_in_deterministic_adapter");
  assert.equal(observed.policy.stop_settle_timeout_ms, 5_000);
  assert.equal(observations[0]!.stop_settle_timeout_ms, 5_000);
  pass("direct_host_golden_persisted_packet_structured_receipt_round_trip");
  pass("direct_host_exact_packet_work_task_lineage_and_plain_root_binding");
  pass("direct_host_reuses_ledger_and_structured_receipt_replay_authority");
  pass("direct_host_receipt_minimizes_data_and_grants_no_semantic_authority");

  assertAutomaticPathBypassesLegacyTextParserV01();
  assertDirectHostRepositoryRelativePathContractV01(
    observed,
    golden.host_result!,
  );
  await assertInteractiveHostRouteOnCloneV01(input);
  await assertDirectHostTerminalScenariosOnClonesV01(input);
  await assertDirectHostStopSettlementOnClonesV01(input);
  await assertDirectHostRepositoryRelativePathPersistenceOnCloneV01(input);
  await assertDirectHostPrestartRefusalsOnClonesV01(input);
  await assertDirectHostRootScopesOnClonesV01(input);
}

function directHostPolicyContextV01(
  observedAt: string,
): NativeHostAutomationContextV01 {
  return {
    policy_ref: {
      ref_version: "external_ref.v0.1",
      ref_type: "automation_policy",
      external_id: "automation-policy:operator-pilot-direct-host",
      observed_at: observedAt,
      source_ref: `sha256:${"a".repeat(64)}`,
      compatibility_namespace: "automation_policy.v0.1",
      trust_class: "direct_local_observation",
    },
    capability_grant_ref: {
      ref_version: "external_ref.v0.1",
      ref_type: "capability_grant",
      external_id: "capability-grant:operator-pilot-direct-host",
      observed_at: observedAt,
      source_ref: `sha256:${"b".repeat(64)}`,
      compatibility_namespace: "bounded_capability_grant.v0.1",
      trust_class: "direct_local_observation",
    },
    control_revision: null,
    automatic_retry_allowed: false,
    scheduler_started: false,
  };
}

function addIsoMillisecondsV01(value: string, milliseconds: number): string {
  return new Date(Date.parse(value) + milliseconds).toISOString();
}

function assertAutomaticPathBypassesLegacyTextParserV01(): void {
  const directSource = readFileSync(
    path.join(
      process.cwd(),
      "lib/vnext/runtime/direct-native-host-round-trip.ts",
    ),
    "utf8",
  );
  const routeSource = readFileSync(
    path.join(
      process.cwd(),
      "app/api/vnext/operator/host-round-trip/route.ts",
    ),
    "utf8",
  );
  const laterResultSource = readFileSync(
    path.join(
      process.cwd(),
      "lib/vnext/runtime/operator-pilot-later-result-intake.ts",
    ),
    "utf8",
  );
  for (const forbidden of [
    "normalizeCodexResultReportV01",
    "codexResultText",
    "codexResultPaste",
    "result_report",
    "handoff_text",
    "packet_json",
  ]) {
    assert.equal(directSource.includes(forbidden), false);
    assert.equal(routeSource.includes(forbidden), false);
  }
  assert.equal(
    directSource.includes("admitStructuredRunReceiptV01"),
    true,
  );
  assert.equal(
    laterResultSource.includes("admitStructuredRunReceiptV01"),
    true,
  );
  pass("automatic_host_path_bypasses_legacy_text_parser_and_shares_receipt_writer");
}

async function assertInteractiveHostRouteOnCloneV01(input: {
  environment: NodeJS.ProcessEnv;
  config: VNextLocalOperatorPilotConfigV01;
  jar: RouteCookieJar;
  packet: TaskContextPacketV01;
}): Promise<void> {
  await withOperatorDatabaseCloneV01(
    "direct-host-interactive-route",
    input.environment,
    async ({ environment }) => {
      const clock = new ManualClock(
        addIsoMillisecondsV01(input.packet.generated_at, 20_000),
      );
      const observations: DeterministicCodexAdapterObservationV01[] = [];
      const adapter = createDeterministicCodexAdapterV01({
        now: () => clock.now(),
        observe: (observation) => observations.push(observation),
      });
      const handler = createVNextOperatorHostRoundTripHandlerV01({
        environment,
        clock,
        secret_source: new DeterministicSecretSource(),
        adapter,
      });
      const cloneJar = new RouteCookieJar();
      cloneJar.setPair(input.jar.header().split("; ")[0]!);
      await expectRouteError(
        await handler(
          routeRequest("/api/vnext/operator/host-round-trip", {
            method: "POST",
            jar: cloneJar,
            body: { packet_json: { forbidden: true } },
          }),
        ),
        400,
        "direct_host_body_must_be_empty",
        "direct_host_user_packet_or_result_transport_rejected",
      );
      assert.equal(observations.length, 0);
      const response = await handler(
        routeRequest("/api/vnext/operator/host-round-trip", {
          method: "POST",
          jar: cloneJar,
          body: {},
        }),
      );
      const body = await publicJson(response);
      assert.equal(response.status, 201);
      assert.equal(body.status, "inserted");
      assert.equal(body.packet_copy_actions, 0);
      assert.equal(body.handoff_paste_actions, 0);
      assert.equal(body.result_paste_actions, 0);
      assert.equal(body.internal_id_entry_actions, 0);
      assert.equal(body.semantic_state_changed, false);
      assert.equal(body.work_closed, false);
      const receipt = body.receipt as RunReceiptV01;
      assert.equal(validateRunReceiptV01(receipt).status, "valid");
      assert.equal(
        receipt.task_context_packet_ref?.external_id,
        input.packet.packet_id,
      );
      assert.equal(observations.length, 1);
      assert.equal(observations[0]!.request.mode, "interactive");
      assert.equal(observations[0]!.request.automation_context, null);
      assert.equal(
        observations[0]!.request.packet.packet_id,
        input.packet.packet_id,
      );
      assert.equal(
        observations[0]!.request.root_scope.canonical_root,
        operatorProjectRoot,
      );
      cloneJar.absorb(response);
      const replay = await handler(
        routeRequest("/api/vnext/operator/host-round-trip", {
          method: "POST",
          jar: cloneJar,
          body: {},
        }),
      );
      assert.equal(replay.status, 200);
      assert.equal((await publicJson(replay)).status, "exact_replay");
      assert.equal(observations.length, 1);
    },
  );
  pass("interactive_and_policy_modes_converge_on_direct_host_orchestrator");
  pass("direct_host_route_accepts_empty_body_only_and_rotates_session_nonce");
}

async function assertDirectHostTerminalScenariosOnClonesV01(input: {
  environment: NodeJS.ProcessEnv;
  config: VNextLocalOperatorPilotConfigV01;
  packet: TaskContextPacketV01;
}): Promise<void> {
  for (const [scenario, expectedOutcome, expectedStatus] of [
    ["failure", "failed", "failed"],
    ["unavailable", "unavailable", "blocked"],
  ] as const) {
    await withOperatorDatabaseCloneV01(
      `direct-host-${scenario}`,
      input.environment,
      async ({ config }) => {
        const clock = new ManualClock(
          addIsoMillisecondsV01(input.packet.generated_at, 25_000),
        );
        const db = openVNextLocalOperatorDatabaseV01(config);
        try {
          const result = await runDirectNativeHostRoundTripV01(
            db,
            { config, mode: "interactive" },
            {
              adapter: createDeterministicCodexAdapterV01({
                scenario,
                now: () => clock.now(),
              }),
              now: () => clock.now(),
            },
          );
          assert.equal(result.status, "inserted");
          assert.equal(result.host_result?.outcome, expectedOutcome);
          assert.equal(result.receipt.execution.status, expectedStatus);
          assert.equal(result.receipt.authority_summary.closes_work, false);
          const continuity = projectVNextOperatorPilotContinuityV01(db, {
            config,
            clock,
          });
          assert.equal(
            continuity.latest_compiled_packet?.packet_id,
            input.packet.packet_id,
          );
        } finally {
          db.close();
        }
      },
    );
  }
  pass("deterministic_host_failure_and_unavailable_results_are_truthful_and_durable");
  pass("optional_host_unavailability_preserves_local_project_continuity");
}

function assertDirectHostRepositoryRelativePathContractV01(
  request: NativeHostRequestV01,
  baseResult: NativeHostResultV01,
): void {
  const rejectedPaths = [
    "/tmp/file.ts",
    String.raw`C:\repo\file.ts`,
    "C:/repo/file.ts",
    String.raw`\\server\share\file.ts`,
    "//server/share/file.ts",
    String.raw`\rooted\file.ts`,
    "C:file.ts",
    "../file.ts",
    String.raw`..\file.ts`,
    "src/../../file.ts",
    "nul\0file.ts",
  ];
  for (const rejectedPath of rejectedPaths) {
    assert.throws(
      () => canonicalizeRepositoryRelativePathV01(rejectedPath),
      /repository_relative_path_invalid/,
      rejectedPath,
    );
    assert.throws(
      () =>
        assertNativeHostResultV01(request, {
          ...baseResult,
          changed_files: [
            {
              repository_relative_path: rejectedPath,
              change_kind: "modified",
              before_hash: null,
              after_hash: null,
            },
          ],
        }),
      /native_host_result_file_scope_invalid/,
      `changed file: ${rejectedPath}`,
    );
    assert.throws(
      () =>
        assertNativeHostResultV01(request, {
          ...baseResult,
          artifacts: [
            {
              artifact_ref: {
                ref_version: "external_ref.v0.1",
                ref_type: "repository_relative_artifact",
                external_id: rejectedPath,
                trust_class: "host_attestation",
              },
              summary: "Rejected repository-relative artifact fixture.",
            },
          ],
        }),
      /native_host_result_file_scope_invalid/,
      `path-like artifact: ${rejectedPath}`,
    );
  }

  for (const [inputPath, expected] of [
    ["src/file.ts", "src/file.ts"],
    ["src/runtime/adapter.ts", "src/runtime/adapter.ts"],
    ["docs/./guide.md", "docs/guide.md"],
    ["docs/vnext/../guide.md", "docs/guide.md"],
  ] as const) {
    assert.equal(canonicalizeRepositoryRelativePathV01(inputPath), expected);
  }

  const normalized = assertNativeHostResultV01(request, {
    ...baseResult,
    changed_files: [
      {
        repository_relative_path: "src/./runtime/adapter.ts",
        change_kind: "modified",
        before_hash: null,
        after_hash: null,
      },
    ],
    artifacts: [
      {
        artifact_ref: {
          ref_version: "external_ref.v0.1",
          ref_type: "repository_relative_artifact",
          external_id: "docs/vnext/../guide.md",
          trust_class: "host_attestation",
        },
        summary: "Canonical repository-relative artifact fixture.",
      },
    ],
  });
  assert.equal(
    normalized.changed_files[0]?.repository_relative_path,
    "src/runtime/adapter.ts",
  );
  assert.equal(
    normalized.artifacts[0]?.artifact_ref.external_id,
    "docs/guide.md",
  );
  const opaque = assertNativeHostResultV01(request, {
    ...baseResult,
    artifacts: [
      {
        artifact_ref: {
          ref_version: "external_ref.v0.1",
          ref_type: "host_artifact_id",
          external_id: String.raw`C:\opaque\provider-id`,
          trust_class: "host_attestation",
        },
        summary: "Opaque provider identifier fixture.",
      },
    ],
  });
  assert.equal(
    opaque.artifacts[0]?.artifact_ref.external_id,
    String.raw`C:\opaque\provider-id`,
  );
  pass("direct_host_cross_platform_repository_relative_paths_are_type_specific_and_canonical");
  reject("direct_host_absolute_rooted_drive_unc_nul_and_escaping_paths_refused");
}

async function assertDirectHostStopSettlementOnClonesV01(input: {
  environment: NodeJS.ProcessEnv;
  packet: TaskContextPacketV01;
}): Promise<void> {
  await withOperatorDatabaseCloneV01(
    "direct-host-timeout-settlement",
    input.environment,
    async ({ config }) => {
      const now = addIsoMillisecondsV01(input.packet.generated_at, 26_000);
      const db = openVNextLocalOperatorDatabaseV01(config);
      try {
        const receiptsBefore = countRowsByKind(db, "run_receipt");
        const controlled = createControlledStopAdapterV01({
          adapter_version: "deterministic_codex_timeout_settlement.v0.1",
          observe_receipt_count: () => countRowsByKind(db, "run_receipt"),
        });
        const activeTimeoutsBefore = activeTimeoutResourceCountV01();
        let roundTripSettled = false;
        const roundTrip = runDirectNativeHostRoundTripV01(
          db,
          { config, mode: "interactive" },
          {
            adapter: controlled.adapter,
            now: () => now,
            timeout_ms: 5,
            stop_settle_timeout_ms: 1_000,
          },
        );
        void roundTrip.then(
          () => {
            roundTripSettled = true;
          },
          () => {
            roundTripSettled = true;
          },
        );
        const invocation = await controlled.invoked.promise;
        await controlled.cleanup_started.promise;
        assert.equal(roundTripSettled, false);
        assert.equal(countRowsByKind(db, "run_receipt"), receiptsBefore);
        assert.equal(readHostRunStateV01(db, invocation.request.run_id).status, "running");
        controlled.release_cleanup.resolve(undefined);
        const result = await roundTrip;
        assert.equal(result.host_result?.outcome, "timed_out");
        assert.equal(result.receipt.execution.status, "cancelled");
        assert.equal(countRowsByKind(db, "run_receipt"), receiptsBefore + 1);
        assert.equal(controlled.state.stop_requests, 1);
        assert.deepEqual(controlled.state.stop_reasons, ["timeout"]);
        assert.equal(controlled.state.cleanup_mutations, 1);
        assert.deepEqual(controlled.state.receipt_counts_during_cleanup, [
          receiptsBefore,
        ]);
        assert.equal(readHostRunStateV01(db, result.run_id).status, "cancelled");
        await Promise.resolve();
        await Promise.resolve();
        assert.equal(controlled.state.cleanup_mutations, 1);
        assert.equal(countRowsByKind(db, "run_receipt"), receiptsBefore + 1);
        assert.equal(activeTimeoutResourceCountV01(), activeTimeoutsBefore);
      } finally {
        db.close();
      }
    },
  );

  await withOperatorDatabaseCloneV01(
    "direct-host-external-cancellation-settlement",
    input.environment,
    async ({ config }) => {
      const now = addIsoMillisecondsV01(input.packet.generated_at, 27_000);
      const db = openVNextLocalOperatorDatabaseV01(config);
      try {
        const receiptsBefore = countRowsByKind(db, "run_receipt");
        const cancellation = instrumentedAbortSignalV01();
        const controlled = createControlledStopAdapterV01({
          adapter_version: "deterministic_codex_cancel_settlement.v0.1",
          observe_receipt_count: () => countRowsByKind(db, "run_receipt"),
        });
        const activeTimeoutsBefore = activeTimeoutResourceCountV01();
        const roundTrip = runDirectNativeHostRoundTripV01(
          db,
          { config, mode: "interactive" },
          {
            adapter: controlled.adapter,
            now: () => now,
            timeout_ms: 60_000,
            stop_settle_timeout_ms: 1_000,
            cancellation_signal: cancellation.signal,
          },
        );
        const invocation = await controlled.invoked.promise;
        cancellation.abort("operator_cancelled");
        cancellation.abort("duplicate_cancel_is_safe");
        await controlled.cleanup_started.promise;
        assert.equal(countRowsByKind(db, "run_receipt"), receiptsBefore);
        assert.equal(readHostRunStateV01(db, invocation.request.run_id).status, "running");
        controlled.release_cleanup.resolve(undefined);
        const result = await roundTrip;
        assert.equal(result.host_result?.outcome, "cancelled");
        assert.equal(countRowsByKind(db, "run_receipt"), receiptsBefore + 1);
        assert.equal(controlled.state.stop_requests, 1);
        assert.deepEqual(controlled.state.stop_reasons, [
          "cancellation_requested",
        ]);
        assert.equal(cancellation.added, 1);
        assert.equal(cancellation.removed, 1);
        assert.deepEqual(controlled.state.receipt_counts_during_cleanup, [
          receiptsBefore,
        ]);
        const replay = await runDirectNativeHostRoundTripV01(
          db,
          { config, mode: "interactive" },
          {
            adapter: controlled.adapter,
            now: () => now,
            timeout_ms: 60_000,
            stop_settle_timeout_ms: 1_000,
            cancellation_signal: cancellation.signal,
          },
        );
        assert.equal(replay.status, "exact_replay");
        assert.equal(replay.receipt.receipt_id, result.receipt.receipt_id);
        assert.equal(controlled.state.invocations, 1);
        assert.equal(controlled.state.stop_requests, 1);
        assert.equal(countRowsByKind(db, "run_receipt"), receiptsBefore + 1);
        assert.equal(activeTimeoutResourceCountV01(), activeTimeoutsBefore);
      } finally {
        db.close();
      }
    },
  );

  await withOperatorDatabaseCloneV01(
    "direct-host-invocation-rejection",
    input.environment,
    async ({ config }) => {
      const now = addIsoMillisecondsV01(input.packet.generated_at, 28_000);
      const db = openVNextLocalOperatorDatabaseV01(config);
      try {
        const receiptsBefore = countRowsByKind(db, "run_receipt");
        let stopRequests = 0;
        const adapter: NativeHostAdapterV01 = {
          adapter_version: "deterministic_codex_rejection.v0.1",
          capability_version: "codex_host_round_trip.v0.1",
          invoke() {
            return {
              result: Promise.reject(new Error("private adapter rejection")),
              settled: Promise.resolve(),
              request_stop() {
                stopRequests += 1;
                return Promise.resolve();
              },
            };
          },
        };
        const listenerState = instrumentedAbortSignalV01();
        const activeTimeoutsBefore = activeTimeoutResourceCountV01();
        const result = await runDirectNativeHostRoundTripV01(
          db,
          { config, mode: "interactive" },
          {
            adapter,
            now: () => now,
            timeout_ms: 60_000,
            stop_settle_timeout_ms: 1_000,
            cancellation_signal: listenerState.signal,
          },
        );
        assert.equal(result.host_result?.outcome, "failed");
        assert.equal(
          result.host_result?.public_stop_reason,
          "native_host_adapter_failed",
        );
        assert.equal(result.receipt.execution.status, "failed");
        assert.equal(
          canonicalizeProtocolValueV01(result.receipt).includes(
            "private adapter rejection",
          ),
          false,
        );
        assert.equal(countRowsByKind(db, "run_receipt"), receiptsBefore + 1);
        assert.equal(stopRequests, 0);
        assert.equal(listenerState.added, 1);
        assert.equal(listenerState.removed, 1);
        assert.equal(activeTimeoutResourceCountV01(), activeTimeoutsBefore);
      } finally {
        db.close();
      }
    },
  );

  await withOperatorDatabaseCloneV01(
    "direct-host-stop-unconfirmed",
    input.environment,
    async ({ config }) => {
      const now = addIsoMillisecondsV01(input.packet.generated_at, 29_000);
      const db = openVNextLocalOperatorDatabaseV01(config);
      try {
        const receiptsBefore = countRowsByKind(db, "run_receipt");
        const invoked = deferredV01<NativeHostRequestV01>();
        let stopRequests = 0;
        const neverResult = new Promise<NativeHostResultV01>(() => undefined);
        const neverSettled = new Promise<void>(() => undefined);
        const adapter: NativeHostAdapterV01 = {
          adapter_version: "deterministic_codex_unsettled.v0.1",
          capability_version: "codex_host_round_trip.v0.1",
          invoke(request) {
            invoked.resolve(request);
            return {
              result: neverResult,
              settled: neverSettled,
              request_stop() {
                stopRequests += 1;
                return Promise.resolve();
              },
            };
          },
        };
        const activeTimeoutsBefore = activeTimeoutResourceCountV01();
        await assert.rejects(
          runDirectNativeHostRoundTripV01(
            db,
            { config, mode: "interactive" },
            {
              adapter,
              now: () => now,
              timeout_ms: 5,
              stop_settle_timeout_ms: 5,
            },
          ),
          /direct_host_stop_unconfirmed/,
        );
        const request = await invoked.promise;
        const run = readHostRunStateV01(db, request.run_id);
        assert.equal(stopRequests, 1);
        assert.equal(run.status, "paused");
        assert.equal(run.finished_at, null);
        assert.equal(run.stop_reason, "native_host_stop_unconfirmed");
        assert.equal(run.metadata.reconciliation_required, true);
        assert.equal(run.metadata.terminal_receipt_persisted, false);
        assert.equal(countRowsByKind(db, "run_receipt"), receiptsBefore);
        assert.equal(activeTimeoutResourceCountV01(), activeTimeoutsBefore);
      } finally {
        db.close();
      }
    },
  );

  pass("direct_host_timeout_waits_for_stop_cleanup_before_one_terminal_receipt");
  pass("direct_host_external_cancellation_is_idempotent_and_settled_before_receipt");
  pass("direct_host_invocation_rejection_is_bounded_and_cleans_control_resources");
  pass("direct_host_unconfirmed_stop_stays_nonterminal_without_receipt");
}

async function assertDirectHostRepositoryRelativePathPersistenceOnCloneV01(
  input: {
    environment: NodeJS.ProcessEnv;
    packet: TaskContextPacketV01;
  },
): Promise<void> {
  await withOperatorDatabaseCloneV01(
    "direct-host-repository-relative-paths",
    input.environment,
    async ({ config }) => {
      const now = addIsoMillisecondsV01(input.packet.generated_at, 29_500);
      const db = openVNextLocalOperatorDatabaseV01(config);
      try {
        const adapter = createRepositoryPathFixtureAdapterV01(() => now);
        const result = await runDirectNativeHostRoundTripV01(
          db,
          { config, mode: "interactive" },
          { adapter, now: () => now },
        );
        assert.equal(
          result.host_result?.changed_files[0]?.repository_relative_path,
          "src/runtime/adapter.ts",
        );
        assert.equal(
          result.host_result?.artifacts[0]?.artifact_ref.external_id,
          "docs/guide.md",
        );
        assert.equal(
          result.receipt.changed_artifacts[0]?.artifact_ref.external_id,
          "src/runtime/adapter.ts",
        );
        assert.equal(
          result.receipt.artifact_refs.some(
            (ref) =>
              ref.ref_type === "repository_relative_artifact" &&
              ref.external_id === "docs/guide.md",
          ),
          true,
        );
        assert.equal(
          canonicalizeProtocolValueV01(result.receipt).includes("../"),
          false,
        );

        const noncanonical = structuredClone(result.receipt);
        replaceRepositoryRelativeExternalIdV01(
          noncanonical,
          "docs/guide.md",
          "docs/./guide.md",
        );
        noncanonical.receipt_id = deriveRunReceiptIdV01(noncanonical);
        noncanonical.integrity.fingerprint =
          createRunReceiptFingerprintV01(noncanonical);
        assert.equal(validateRunReceiptV01(noncanonical).status, "valid");
        const receiptsBefore = countRowsByKind(db, "run_receipt");
        assert.throws(
          () => admitStructuredRunReceiptV01(db, noncanonical),
          /structured_run_receipt_repository_path_invalid/,
        );
        assert.equal(countRowsByKind(db, "run_receipt"), receiptsBefore);
      } finally {
        db.close();
      }
    },
  );
  pass("direct_host_receipt_persists_only_canonical_repository_relative_paths");
  reject("structured_receipt_writer_refuses_noncanonical_path_like_refs");
}

function createControlledStopAdapterV01(input: {
  adapter_version: string;
  observe_receipt_count: () => number;
}): {
  adapter: NativeHostAdapterV01;
  invoked: DeferredV01<{
    request: NativeHostRequestV01;
    control: NativeHostInvocationControlV01;
  }>;
  cleanup_started: DeferredV01<void>;
  release_cleanup: DeferredV01<void>;
  state: {
    invocations: number;
    stop_requests: number;
    stop_reasons: NativeHostStopRequestV01["reason"][];
    cleanup_mutations: number;
    receipt_counts_during_cleanup: number[];
  };
} {
  const invoked = deferredV01<{
    request: NativeHostRequestV01;
    control: NativeHostInvocationControlV01;
  }>();
  const cleanupStarted = deferredV01<void>();
  const releaseCleanup = deferredV01<void>();
  const result = deferredV01<NativeHostResultV01>();
  const settled = deferredV01<void>();
  const state = {
    invocations: 0,
    stop_requests: 0,
    stop_reasons: [] as NativeHostStopRequestV01["reason"][],
    cleanup_mutations: 0,
    receipt_counts_during_cleanup: [] as number[],
  };
  let stopPromise: Promise<void> | null = null;
  const adapter: NativeHostAdapterV01 = {
    adapter_version: input.adapter_version,
    capability_version: "codex_host_round_trip.v0.1",
    invoke(request, control) {
      state.invocations += 1;
      invoked.resolve({ request, control });
      return {
        result: result.promise,
        settled: settled.promise,
        request_stop(stopRequest) {
          if (stopPromise) return stopPromise;
          state.stop_requests += 1;
          state.stop_reasons.push(stopRequest.reason);
          stopPromise = (async () => {
            assert.equal(control.cancellation_signal.aborted, true);
            cleanupStarted.resolve(undefined);
            await releaseCleanup.promise;
            state.cleanup_mutations += 1;
            state.receipt_counts_during_cleanup.push(
              input.observe_receipt_count(),
            );
            result.reject(new Error("controlled adapter stopped"));
            settled.resolve(undefined);
          })();
          return stopPromise;
        },
      };
    },
  };
  return {
    adapter,
    invoked,
    cleanup_started: cleanupStarted,
    release_cleanup: releaseCleanup,
    state,
  };
}

interface DeferredV01<T> {
  promise: Promise<T>;
  resolve(value: T | PromiseLike<T>): void;
  reject(reason?: unknown): void;
}

function deferredV01<T>(): DeferredV01<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function readHostRunStateV01(
  db: Database.Database,
  runId: string,
): {
  status: string;
  finished_at: string | null;
  stop_reason: string | null;
  metadata: Record<string, unknown>;
} {
  const row = db
    .prepare(
      `SELECT status, finished_at, stop_reason, metadata_json
       FROM autonomy_runs WHERE run_id = ?`,
    )
    .get(runId) as
    | {
        status: string;
        finished_at: string | null;
        stop_reason: string | null;
        metadata_json: string;
      }
    | undefined;
  assert(row);
  return {
    status: row.status,
    finished_at: row.finished_at,
    stop_reason: row.stop_reason,
    metadata: JSON.parse(row.metadata_json) as Record<string, unknown>,
  };
}

function instrumentedAbortSignalV01(): {
  signal: AbortSignal;
  abort(reason?: unknown): void;
  readonly added: number;
  readonly removed: number;
} {
  let added = 0;
  let removed = 0;
  let aborted = false;
  let abortReason: unknown = undefined;
  const listeners = new Set<EventListenerOrEventListenerObject>();
  const signal = {
    get aborted() {
      return aborted;
    },
    get reason() {
      return abortReason;
    },
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
    ) {
      if (type === "abort" && listener) {
        added += 1;
        listeners.add(listener);
      }
    },
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
    ) {
      if (type === "abort" && listener) {
        removed += 1;
        listeners.delete(listener);
      }
    },
  } as unknown as AbortSignal;
  return {
    signal,
    abort(reason?: unknown) {
      if (aborted) return;
      aborted = true;
      abortReason = reason;
      const event = new Event("abort");
      for (const listener of listeners) {
        if (typeof listener === "function") listener.call(signal, event);
        else listener.handleEvent(event);
      }
    },
    get added() {
      return added;
    },
    get removed() {
      return removed;
    },
  };
}

function activeTimeoutResourceCountV01(): number {
  return (
    process as unknown as { getActiveResourcesInfo(): string[] }
  )
    .getActiveResourcesInfo()
    .filter((resource) => resource === "Timeout").length;
}

function createRepositoryPathFixtureAdapterV01(
  now: () => string,
): NativeHostAdapterV01 {
  const adapterVersion = "deterministic_codex_repository_paths.v0.1";
  const capabilityVersion = "codex_host_round_trip.v0.1";
  const baseAdapter = createDeterministicCodexAdapterV01({ now });
  return {
    adapter_version: adapterVersion,
    capability_version: capabilityVersion,
    invoke(request, control) {
      const base = baseAdapter.invoke(request, control);
      const result = base.result.then(
        (hostResult): NativeHostResultV01 => ({
          ...hostResult,
          adapter_version: adapterVersion,
          capability_version: capabilityVersion,
          changed_files: [
            {
              repository_relative_path: "src/./runtime/adapter.ts",
              change_kind: "modified",
              before_hash: null,
              after_hash: `sha256:${"c".repeat(64)}`,
            },
          ],
          artifacts: [
            {
              artifact_ref: {
                ref_version: "external_ref.v0.1",
                ref_type: "repository_relative_artifact",
                external_id: "docs/vnext/../guide.md",
                observed_at: now(),
                trust_class: "host_attestation",
              },
              summary: "Canonicalized path-like artifact fixture.",
            },
          ],
        }),
      );
      const resultSettled = result.then(
        () => undefined,
        () => undefined,
      );
      return {
        result,
        request_stop(stopRequest) {
          return base.request_stop(stopRequest);
        },
        settled: Promise.all([base.settled, resultSettled]).then(
          () => undefined,
        ),
      };
    },
  };
}

function replaceRepositoryRelativeExternalIdV01(
  value: unknown,
  from: string,
  to: string,
): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      replaceRepositoryRelativeExternalIdV01(item, from, to);
    }
    return;
  }
  if (!value || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  if (
    record.ref_version === "external_ref.v0.1" &&
    record.ref_type === "repository_relative_artifact" &&
    record.external_id === from
  ) {
    record.external_id = to;
  }
  for (const child of Object.values(record)) {
    replaceRepositoryRelativeExternalIdV01(child, from, to);
  }
}

async function assertDirectHostPrestartRefusalsOnClonesV01(input: {
  environment: NodeJS.ProcessEnv;
  config: VNextLocalOperatorPilotConfigV01;
  packet: TaskContextPacketV01;
}): Promise<void> {
  await expectDirectHostPrestartRefusalV01({
    label: "missing-packet",
    environment: input.environment,
    packet: input.packet,
    selection: {
      packet_id: "task-context-packet:000000000000000000000000",
      packet_fingerprint: `sha256:${"0".repeat(64)}`,
    },
    expected_code: /packet_missing/,
  });
  await expectDirectHostPrestartRefusalV01({
    label: "fingerprint-mismatch",
    environment: input.environment,
    packet: input.packet,
    selection: {
      packet_id: input.packet.packet_id,
      packet_fingerprint: `sha256:${"f".repeat(64)}`,
    },
    expected_code: /fingerprint_mismatch/,
  });
  await expectDirectHostPrestartRefusalV01({
    label: "expired-packet",
    environment: input.environment,
    packet: input.packet,
    now: addIsoMillisecondsV01(input.packet.expires_at!, 1),
    expected_code: /packet_expired/,
  });
  await expectDirectHostPrestartRefusalV01({
    label: "stale-projection",
    environment: input.environment,
    packet: input.packet,
    setup(db) {
      const changed = db
        .prepare(
          `UPDATE vnext_semantic_target_heads
           SET revision = revision + 1
           WHERE workspace_id = ? AND project_id = ?`,
        )
        .run(input.config.workspace_id, input.config.project_id).changes;
      assert(changed > 0);
    },
    expected_code: /drift|stale|relation/,
  });
  await expectDirectHostPrestartRefusalV01({
    label: "malformed-packet",
    environment: input.environment,
    packet: input.packet,
    setup(db) {
      db.prepare(
        `INSERT INTO vnext_core_records (
          record_kind, record_id, workspace_id, project_id, fingerprint,
          idempotency_key, payload_json, created_at
        ) VALUES ('task_context_packet', ?, ?, ?, ?, NULL, '{}', ?)`,
      ).run(
        "task-context-packet:ffffffffffffffffffffffff",
        input.config.workspace_id,
        input.config.project_id,
        `sha256:${"f".repeat(64)}`,
        addIsoMillisecondsV01(input.packet.generated_at, 31_000),
      );
    },
    expected_code: /packet_invalid/,
  });
  await expectDirectHostPrestartRefusalV01({
    label: "superseded-packet",
    environment: input.environment,
    packet: input.packet,
    selection: {
      packet_id: input.packet.packet_id,
      packet_fingerprint: input.packet.integrity.fingerprint,
    },
    setup(db) {
      const superseding = rebuildPacketForLineageTest(input.packet, {
        generated_at: addIsoMillisecondsV01(
          input.packet.generated_at,
          31_000,
        ),
        expires_at: addIsoMillisecondsV01(
          input.packet.generated_at,
          24 * 60 * 60 * 1000 + 31_000,
        ),
      });
      insertPacketRecord(db, superseding);
    },
    expected_code: /packet_superseded/,
  });
  await expectDirectHostPrestartRefusalV01({
    label: "cross-project-packet",
    environment: input.environment,
    packet: input.packet,
    selection: {
      packet_id: input.packet.packet_id,
      packet_fingerprint: input.packet.integrity.fingerprint,
    },
    setup(db) {
      const foreignRoot = path.join(tempRoot, "direct-host-foreign-root");
      mkdirSync(foreignRoot, { recursive: true, mode: 0o700 });
      const registration = getOrCreateCanonicalProjectForLocalRootV01(
        db,
        {
          workspace_id: input.config.workspace_id,
          local_root: normalizeLocalProjectRootRefV01(foreignRoot, {
            base_path: path.parse(foreignRoot).root,
          }),
          display_name: "Foreign Direct Host Project",
        },
        {
          create_uuid: () => "33333333-3333-4333-8333-333333333333",
          now: () => addIsoMillisecondsV01(input.packet.generated_at, 30_000),
        },
      );
      assert.equal(registration.project.project_id, FOREIGN_PROJECT_ID);
      selectActiveProjectV01(db, {
        workspace_id: input.config.workspace_id,
        project_id: FOREIGN_PROJECT_ID,
        now: addIsoMillisecondsV01(input.packet.generated_at, 30_000),
        expected_project_id: input.config.project_id,
        expected_revision: 1,
      });
      return { ...input.config, project_id: FOREIGN_PROJECT_ID };
    },
    expected_code: /packet_missing|scope_mismatch/,
  });
  pass("missing_malformed_stale_superseded_fingerprint_and_cross_project_packets_refuse_prestart");
}

async function expectDirectHostPrestartRefusalV01(input: {
  label: string;
  environment: NodeJS.ProcessEnv;
  packet: TaskContextPacketV01;
  selection?: { packet_id: string; packet_fingerprint: string };
  now?: string;
  setup?: (
    db: Database.Database,
  ) => VNextLocalOperatorPilotConfigV01 | void;
  expected_code: RegExp;
}): Promise<void> {
  await withOperatorDatabaseCloneV01(
    `direct-host-prestart-${input.label}`,
    input.environment,
    async ({ config }) => {
      const db = openVNextLocalOperatorDatabaseV01(config);
      try {
        const exactConfig = input.setup?.(db) ?? config;
        const now =
          input.now ?? addIsoMillisecondsV01(input.packet.generated_at, 30_000);
        const beforeRuns = countTableRows(db, "autonomy_runs");
        const beforeReceipts = countRowsByKind(db, "run_receipt");
        let invocationCount = 0;
        const adapter = createDeterministicCodexAdapterV01({
          now: () => now,
          observe: () => {
            invocationCount += 1;
          },
        });
        let observedCode = "";
        try {
          await runDirectNativeHostRoundTripV01(
            db,
            {
              config: exactConfig,
              mode: "policy_triggered",
              automation_context: directHostPolicyContextV01(now),
            },
            {
              adapter,
              now: () => now,
              ...(input.selection
                ? {
                    resolve_packet_selection: () => input.selection!,
                  }
                : {}),
            },
          );
          assert.fail(`${input.label} unexpectedly invoked the adapter`);
        } catch (error) {
          observedCode =
            error && typeof error === "object" && "code" in error
              ? String(error.code)
              : error instanceof Error
                ? error.message
                : String(error);
        }
        assert.match(observedCode, input.expected_code, input.label);
        assert.equal(invocationCount, 0, input.label);
        assert.equal(countTableRows(db, "autonomy_runs"), beforeRuns, input.label);
        assert.equal(
          countRowsByKind(db, "run_receipt"),
          beforeReceipts,
          input.label,
        );
      } finally {
        db.close();
      }
    },
  );
  reject(`direct_host_prestart_${input.label.replaceAll("-", "_")}`);
}

async function assertDirectHostRootScopesOnClonesV01(input: {
  environment: NodeJS.ProcessEnv;
  packet: TaskContextPacketV01;
}): Promise<void> {
  for (const rootKind of ["git_repository", "git_worktree"] as const) {
    await withOperatorDatabaseCloneV01(
      `direct-host-root-${rootKind}`,
      input.environment,
      async ({ config }) => {
        const root = path.join(tempRoot, `direct-host-${rootKind}-root`);
        mkdirSync(root, { recursive: true, mode: 0o700 });
        if (rootKind === "git_repository") {
          mkdirSync(path.join(root, ".git"), {
            recursive: true,
            mode: 0o700,
          });
          writeFileSync(
            path.join(root, ".git", "config"),
            "[core]\n\trepositoryformatversion = 0\n",
            { mode: 0o600 },
          );
        } else {
          const metadata = path.join(
            tempRoot,
            "direct-host-worktree-metadata",
          );
          mkdirSync(metadata, { recursive: true, mode: 0o700 });
          writeFileSync(
            path.join(metadata, "config"),
            "[core]\n\trepositoryformatversion = 0\n",
            { mode: 0o600 },
          );
          writeFileSync(path.join(root, ".git"), `gitdir: ${metadata}\n`, {
            mode: 0o600,
          });
        }
        const db = openVNextLocalOperatorDatabaseV01(config);
        try {
          const now = addIsoMillisecondsV01(input.packet.generated_at, 35_000);
          rebindCanonicalProjectLocalRootV01(
            db,
            {
              workspace_id: config.workspace_id,
              project_id: config.project_id,
              local_root: normalizeLocalProjectRootRefV01(root, {
                base_path: path.parse(root).root,
              }),
            },
            { now: () => now },
          );
          const observations: DeterministicCodexAdapterObservationV01[] = [];
          const result = await runDirectNativeHostRoundTripV01(
            db,
            { config, mode: "interactive" },
            {
              adapter: createDeterministicCodexAdapterV01({
                now: () => now,
                observe: (observation) => observations.push(observation),
              }),
              now: () => now,
            },
          );
          assert.equal(result.status, "inserted");
          assert.equal(observations.length, 1);
          assert.equal(observations[0]!.request.root_scope.root_kind, rootKind);
          assert.equal(observations[0]!.request.root_scope.canonical_root, root);
          assert.equal(
            observations[0]!.request.root_scope.selected_worktree_ref !== null,
            rootKind === "git_worktree",
          );
          assert.equal(
            canonicalizeProtocolValueV01(result.receipt).includes(root),
            false,
          );
          assert.equal(
            result.receipt.task_context_packet_ref?.external_id,
            input.packet.packet_id,
          );
        } finally {
          db.close();
        }
      },
    );
  }
  pass("plain_folder_git_repository_and_selected_worktree_scopes_remain_project_bound");
}

async function withOperatorDatabaseCloneV01<T>(
  label: string,
  environment: NodeJS.ProcessEnv,
  action: (input: {
    database_path: string;
    environment: NodeJS.ProcessEnv;
    config: VNextLocalOperatorPilotConfigV01;
  }) => Promise<T>,
): Promise<T> {
  const databasePath = path.join(
    tempRoot,
    `${label.replace(/[^a-z0-9-]/gi, "-")}.db`,
  );
  const source = new Database(canonicalDbPath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    await source.backup(databasePath);
  } finally {
    source.close();
  }
  const cloneEnvironment = {
    ...environment,
    AUGNES_DB_PATH: databasePath,
  };
  const config = readVNextLocalOperatorPilotConfigV01(cloneEnvironment);
  try {
    return await action({
      database_path: databasePath,
      environment: cloneEnvironment,
      config,
    });
  } finally {
    for (const candidate of [
      databasePath,
      `${databasePath}-wal`,
      `${databasePath}-shm`,
      `${databasePath}-journal`,
    ]) {
      rmSync(candidate, { force: true });
    }
  }
}

function countRowsByKind(db: Database.Database, recordKind: string): number {
  return (
    db
      .prepare(
        `SELECT COUNT(*) AS count FROM vnext_core_records WHERE record_kind = ?`,
      )
      .get(recordKind) as { count: number }
  ).count;
}

function countTableRows(db: Database.Database, table: string): number {
  assert.match(table, /^[a-z_]+$/);
  return (
    db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as {
      count: number;
    }
  ).count;
}

type WorkbenchLineageStageV01 =
  | "not_applied"
  | "applied_awaiting_packet"
  | "packet_compiled_awaiting_result"
  | "later_result_recorded_awaiting_review"
  | "reviewed";

interface WorkbenchDurableLineageReadV01 {
  proposal_id: string;
  proposal_fingerprint: string;
  overall_status: WorkbenchLineageStageV01;
  read_only: boolean;
  semantic_authority_granted: boolean;
  chains: Array<{
    stage_status: Exclude<WorkbenchLineageStageV01, "not_applied">;
    transition: {
      receipt_id: string;
      receipt_fingerprint: string;
    };
    compiled_packet: null | {
      packet_id: string;
      packet_fingerprint: string;
      handoff_href: string;
    };
    later_result: null | {
      receipt_id: string;
      receipt_fingerprint: string;
      actual_use_review_required: boolean;
      helpfulness_established: boolean;
    };
    context_use_review: null | {
      review_id: string;
      review_fingerprint: string;
    };
  }>;
}

async function assertWorkbenchDurableLineageRoute(input: {
  handlers: { GET: (request: Request) => Response | Promise<Response> };
  jar: RouteCookieJar;
  proposal: EpisodeDeltaProposalV01;
  expected_status: WorkbenchLineageStageV01;
  receipt?: {
    transition_receipt_id: string;
    integrity: { fingerprint: string };
  };
  packet?: { packet_id: string; integrity: { fingerprint: string } };
  later_result?: { receipt_id: string; integrity: { fingerprint: string } };
  context_use_review?: {
    review_id: string;
    integrity: { fingerprint: string };
  };
  handoff_href?: string;
}): Promise<void> {
  const response = await input.handlers.GET(
    routeRequest("/api/vnext/operator/semantic-review", {
      method: "GET",
      jar: input.jar,
      query: { proposal_id: input.proposal.proposal_id },
    }),
  );
  const body = await publicJson(response);
  assert.equal(response.status, 200);
  assert.equal(body.status, "proposal_detail");
  const detail = body.proposal as {
    proposal: EpisodeDeltaProposalV01;
    durable_lineage: WorkbenchDurableLineageReadV01;
  };
  assertWorkbenchDurableLineageRead({
    detail,
    proposal: input.proposal,
    expected_status: input.expected_status,
    receipt: input.receipt,
    packet: input.packet,
    later_result: input.later_result,
    context_use_review: input.context_use_review,
    handoff_href: input.handoff_href,
  });
}

function assertWorkbenchDurableLineageRead(input: {
  detail: {
    proposal: EpisodeDeltaProposalV01;
    durable_lineage: WorkbenchDurableLineageReadV01;
  };
  proposal: EpisodeDeltaProposalV01;
  expected_status: WorkbenchLineageStageV01;
  receipt?: {
    transition_receipt_id: string;
    integrity: { fingerprint: string };
  };
  packet?: { packet_id: string; integrity: { fingerprint: string } };
  later_result?: { receipt_id: string; integrity: { fingerprint: string } };
  context_use_review?: {
    review_id: string;
    integrity: { fingerprint: string };
  };
  handoff_href?: string;
}): void {
  assert.equal(input.detail.proposal.proposal_id, input.proposal.proposal_id);
  assert.equal(
    input.detail.proposal.integrity.fingerprint,
    input.proposal.integrity.fingerprint,
  );
  const lineage = input.detail.durable_lineage;
  assert.equal(lineage.proposal_id, input.proposal.proposal_id);
  assert.equal(
    lineage.proposal_fingerprint,
    input.proposal.integrity.fingerprint,
  );
  assert.equal(lineage.overall_status, input.expected_status);
  assert.equal(lineage.read_only, true);
  assert.equal(lineage.semantic_authority_granted, false);
  if (input.expected_status === "not_applied") {
    assert.deepEqual(lineage.chains, []);
    return;
  }
  assert.equal(lineage.chains.length, 1);
  const chain = lineage.chains[0]!;
  assert.equal(chain.stage_status, input.expected_status);
  assert(input.receipt);
  assert.equal(
    chain.transition.receipt_id,
    input.receipt.transition_receipt_id,
  );
  assert.equal(
    chain.transition.receipt_fingerprint,
    input.receipt.integrity.fingerprint,
  );
  if (!input.packet) {
    assert.equal(chain.compiled_packet, null);
    assert.equal(chain.later_result, null);
    assert.equal(chain.context_use_review, null);
    return;
  }
  assert.equal(chain.compiled_packet?.packet_id, input.packet.packet_id);
  assert.equal(
    chain.compiled_packet?.packet_fingerprint,
    input.packet.integrity.fingerprint,
  );
  assert.equal(chain.compiled_packet?.handoff_href, input.handoff_href);
  if (!input.later_result) {
    assert.equal(chain.later_result, null);
    assert.equal(chain.context_use_review, null);
    return;
  }
  assert.equal(chain.later_result?.receipt_id, input.later_result.receipt_id);
  assert.equal(
    chain.later_result?.receipt_fingerprint,
    input.later_result.integrity.fingerprint,
  );
  assert.equal(chain.later_result?.actual_use_review_required, true);
  assert.equal(chain.later_result?.helpfulness_established, false);
  if (!input.context_use_review) {
    assert.equal(chain.context_use_review, null);
    return;
  }
  assert.equal(
    chain.context_use_review?.review_id,
    input.context_use_review.review_id,
  );
  assert.equal(
    chain.context_use_review?.review_fingerprint,
    input.context_use_review.integrity.fingerprint,
  );
}

async function assertWorkbenchLineageFailClosedCoverage(input: {
  environment: NodeJS.ProcessEnv;
  config: VNextLocalOperatorPilotConfigV01;
  proposal: EpisodeDeltaProposalV01;
  prior_packet: TaskContextPacketV01;
  receipt: StateTransitionReceiptV01;
  packet: TaskContextPacketV01;
  later_result: RunReceiptV01;
  context_use_review: ContextUseReviewV01;
}): Promise<void> {
  await withClonedLineageDatabase(
    input.environment,
    "foreign-project-packet",
    (db, config) => {
      const foreignPacket = rebuildPacketForLineageTest(input.packet, {
        project_id: "project:operator-pilot-smoke-foreign-lineage",
      });
      insertPacketRecord(db, foreignPacket);
      const lineage = readLineageForSmoke(db, config, input.proposal);
      assert.equal(
        lineage.chains[0]?.compiled_packet?.packet_id,
        input.packet.packet_id,
      );
    },
  );
  reject("workbench_lineage_foreign_project_packet_not_attached");

  await withClonedLineageDatabase(
    input.environment,
    "packet-another-receipt",
    (db, config) => {
      const packet = rebuildPacketWithReceiptRef(
        input.packet,
        `state-transition-receipt:${"a".repeat(24)}`,
        `sha256:${"a".repeat(64)}`,
      );
      insertPacketRecord(db, packet);
      assertLineageReadFailsClosed(db, config, input.proposal);
    },
  );
  reject("workbench_lineage_packet_from_another_receipt_rejected");

  await withClonedLineageDatabase(
    input.environment,
    "packet-another-proposal",
    (db, config) => {
      const packet = rebuildPacketWithReceiptRef(
        input.packet,
        `state-transition-receipt:${"b".repeat(24)}`,
        `sha256:${"b".repeat(64)}`,
      );
      insertPacketRecord(db, packet);
      assertLineageReadFailsClosed(db, config, input.proposal);
    },
  );
  reject("workbench_lineage_packet_from_another_proposal_relation_rejected");

  await withClonedLineageDatabase(
    input.environment,
    "wrong-packet-fingerprint",
    (db, config) => {
      mutateCoreRecordForLineageTest(
        db,
        "task_context_packet",
        input.packet.packet_id,
        () => {
          db.prepare(
            `UPDATE vnext_core_records SET fingerprint = ?
             WHERE record_kind = 'task_context_packet' AND record_id = ?`,
          ).run(`sha256:${"c".repeat(64)}`, input.packet.packet_id);
        },
      );
      assertLineageReadFailsClosed(db, config, input.proposal);
    },
  );
  reject("workbench_lineage_wrong_persisted_packet_fingerprint_rejected");

  await withClonedLineageDatabase(
    input.environment,
    "duplicate-packet-relation",
    (db, config) => {
      const duplicate = compileTaskContextPacketFromPersistedSemanticStateV01(
        db,
        {
          workspace_id: config.workspace_id,
          project_id: config.project_id,
          prior_packet: input.prior_packet,
          transition_receipt_id: input.receipt.transition_receipt_id,
          transition_receipt_fingerprint: input.receipt.integrity.fingerprint,
          expiry_policy: { mode: "explicit", expires_at: null },
          clock: new ManualClock(
            "2026-07-11T09:20:01.000Z",
            browserFixtureTimeOffset,
          ),
        },
      );
      assert.notEqual(duplicate.later_packet.packet_id, input.packet.packet_id);
      assertLineageReadFailsClosed(db, config, input.proposal);
    },
  );
  reject("workbench_lineage_duplicate_compiled_packet_relation_rejected");

  await withClonedLineageDatabase(
    input.environment,
    "later-result-another-packet",
    (db, config) => {
      const receipt = rebuildRunReceiptForLineageTest(input.later_result, {
        run_id: "run:operator-pilot-lineage-wrong-packet",
        task_context_packet_ref: {
          ...input.later_result.task_context_packet_ref!,
          external_id: input.prior_packet.packet_id,
          source_ref: input.prior_packet.integrity.fingerprint,
        },
      });
      insertRunReceiptRecord(db, receipt);
      assertLineageReadFailsClosed(db, config, input.proposal);
    },
  );
  reject("workbench_lineage_result_from_another_packet_rejected");

  await withClonedLineageDatabase(
    input.environment,
    "later-result-another-transition",
    (db, config) => {
      const receipt = rebuildRunReceiptForLineageTest(input.later_result, {
        run_id: "run:operator-pilot-lineage-wrong-transition",
        external_refs: input.later_result.external_refs.map((ref) =>
          ref.ref_type === "state_transition_receipt"
            ? {
                ...ref,
                external_id: `state-transition-receipt:${"d".repeat(24)}`,
                source_ref: `sha256:${"d".repeat(64)}`,
              }
            : ref,
        ),
      });
      insertRunReceiptRecord(db, receipt);
      assertLineageReadFailsClosed(db, config, input.proposal);
    },
  );
  reject("workbench_lineage_result_from_another_transition_rejected");

  await withClonedLineageDatabase(
    input.environment,
    "generic-probe-receipt",
    (db, config) => {
      const genericRecord = db
        .prepare(
          `SELECT record_id FROM vnext_core_records
           WHERE workspace_id = ? AND project_id = ? AND record_kind = 'run_receipt'
             AND record_id <> ?
           ORDER BY created_at, record_id LIMIT 1`,
        )
        .get(
          config.workspace_id,
          config.project_id,
          input.later_result.receipt_id,
        ) as { record_id: string } | undefined;
      assert(genericRecord);
      const record = readVNextCoreRecordV01(db, {
        record_kind: "run_receipt",
        record_id: genericRecord.record_id,
        workspace_id: config.workspace_id,
        project_id: config.project_id,
      });
      assert(record);
      const generic = rebuildRunReceiptForLineageTest(
        record.payload as RunReceiptV01,
        {
          run_id: "run:operator-pilot-lineage-generic-probe",
          task_context_packet_ref: {
            ...input.later_result.task_context_packet_ref!,
            observed_at: (record.payload as RunReceiptV01).recorded_at,
          },
        },
      );
      assert.equal(
        generic.compatibility.source_contracts.includes(
          "vnext_operator_pilot_later_result_intake.v0.1",
        ),
        false,
      );
      insertRunReceiptRecord(db, generic);
      const lineage = readLineageForSmoke(db, config, input.proposal);
      assert.equal(
        lineage.chains[0]?.later_result?.receipt_id,
        input.later_result.receipt_id,
      );
    },
  );
  reject("workbench_lineage_generic_probe_receipt_not_substituted");

  await withClonedLineageDatabase(
    input.environment,
    "review-another-result",
    (db, config) => {
      const review = rebuildContextUseReviewForLineageTest(
        input.context_use_review,
        {
          later_task_run_receipt: {
            ...input.context_use_review.later_task_run_receipt,
            receipt_id: `run-receipt:${"e".repeat(24)}`,
            receipt_fingerprint: `sha256:${"e".repeat(64)}`,
          },
        },
      );
      insertContextUseReviewRecord(db, review);
      assertLineageReadFailsClosed(db, config, input.proposal);
    },
  );
  reject("workbench_lineage_review_from_another_later_result_rejected");

  for (const [label, kind, recordId] of [
    ["malformed-packet", "task_context_packet", input.packet.packet_id],
    ["malformed-result", "run_receipt", input.later_result.receipt_id],
    [
      "malformed-review",
      "context_use_review",
      input.context_use_review.review_id,
    ],
  ] as const) {
    await withClonedLineageDatabase(
      input.environment,
      label,
      (db, config) => {
        mutatePayloadForLineageTest(db, kind, recordId, (payload) => {
          payload.unexpected_persisted_field = true;
        });
        assertLineageReadFailsClosed(db, config, input.proposal);
      },
    );
    reject(`workbench_lineage_${label.replaceAll("-", "_")}_rejected`);
  }

  await withClonedLineageDatabase(
    input.environment,
    "unknown-relation-field",
    (db, config) => {
      mutatePayloadForLineageTest(
        db,
        "task_context_packet",
        input.packet.packet_id,
        (payload) => {
          const compatibility = payload.compatibility as Record<
            string,
            unknown
          >;
          compatibility.unknown_relation = "must-fail-closed";
        },
      );
      assertLineageReadFailsClosed(db, config, input.proposal);
    },
  );
  reject("workbench_lineage_unknown_relation_field_rejected");
}

async function withClonedLineageDatabase(
  environment: NodeJS.ProcessEnv,
  label: string,
  run: (
    db: Database.Database,
    config: VNextLocalOperatorPilotConfigV01,
  ) => void,
): Promise<void> {
  const clonePath = path.join(tempRoot, `workbench-lineage-${label}.db`);
  const source = new Database(canonicalDbPath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    await source.backup(clonePath);
  } finally {
    source.close();
  }
  const config = readVNextLocalOperatorPilotConfigV01({
    ...environment,
    AUGNES_DB_PATH: clonePath,
  });
  const db = new Database(clonePath, { fileMustExist: true });
  try {
    db.pragma("foreign_keys = ON");
    run(db, config);
    assert.deepEqual(db.pragma("integrity_check"), [{ integrity_check: "ok" }]);
  } finally {
    db.close();
    for (const candidate of [
      clonePath,
      `${clonePath}-wal`,
      `${clonePath}-shm`,
      `${clonePath}-journal`,
    ]) {
      rmSync(candidate, { force: true });
    }
  }
}

function readLineageForSmoke(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  proposal: EpisodeDeltaProposalV01,
) {
  return readVNextOperatorPilotProposalDurableLineageV01(db, {
    config,
    proposal,
    clock: new ManualClock(
      "2026-07-11T09:25:00.000Z",
      browserFixtureTimeOffset,
    ),
  });
}

function assertLineageReadFailsClosed(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  proposal: EpisodeDeltaProposalV01,
): void {
  assert.throws(
    () => readLineageForSmoke(db, config, proposal),
    /operator_pilot_workbench_lineage_/,
  );
}

function rebuildPacketForLineageTest(
  packet: TaskContextPacketV01,
  overrides: Partial<Parameters<typeof buildTaskContextPacketV01>[0]>,
): TaskContextPacketV01 {
  const {
    packet_version: _version,
    packet_id: _packetId,
    authority_summary: authoritySummary,
    integrity: _integrity,
    ...input
  } = packet;
  return buildTaskContextPacketV01({
    ...input,
    ...overrides,
    authority_notes: authoritySummary.notes,
  });
}

function rebuildPacketWithReceiptRef(
  packet: TaskContextPacketV01,
  receiptId: string,
  receiptFingerprint: string,
): TaskContextPacketV01 {
  return rebuildPacketForLineageTest(packet, {
    compatibility: {
      ...packet.compatibility,
      source_refs: packet.compatibility.source_refs.map((ref) =>
        ref.ref_type === "state_transition_receipt"
          ? {
              ...ref,
              external_id: receiptId,
              source_ref: receiptFingerprint,
            }
          : ref,
      ),
    },
  });
}

function rebuildRunReceiptForLineageTest(
  receipt: RunReceiptV01,
  overrides: Partial<Parameters<typeof buildRunReceiptV01>[0]>,
): RunReceiptV01 {
  const {
    receipt_version: _version,
    receipt_id: _receiptId,
    trust_summary: _trustSummary,
    authority_summary: authoritySummary,
    idempotency_key: _idempotencyKey,
    integrity: _integrity,
    ...input
  } = receipt;
  return buildRunReceiptV01({
    ...input,
    ...overrides,
    authority_notes: authoritySummary.notes,
  });
}

function rebuildContextUseReviewForLineageTest(
  review: ContextUseReviewV01,
  overrides: Partial<Parameters<typeof buildContextUseReviewV01>[0]>,
): ContextUseReviewV01 {
  const {
    review_version: _version,
    review_id: _reviewId,
    material_boundary: _materialBoundary,
    authority_summary: authoritySummary,
    integrity: _integrity,
    ...input
  } = review;
  return buildContextUseReviewV01({
    ...input,
    ...overrides,
    authority_notes: authoritySummary.notes,
  });
}

function insertPacketRecord(
  db: Database.Database,
  packet: TaskContextPacketV01,
): void {
  insertVNextCoreRecordV01(db, {
    record_kind: "task_context_packet",
    record_id: packet.packet_id,
    workspace_id: packet.workspace_id,
    project_id: packet.project_id,
    fingerprint: packet.integrity.fingerprint,
    idempotency_key: null,
    payload: packet,
    created_at: packet.generated_at,
  });
}

function insertRunReceiptRecord(
  db: Database.Database,
  receipt: RunReceiptV01,
): void {
  insertVNextCoreRecordV01(db, {
    record_kind: "run_receipt",
    record_id: receipt.receipt_id,
    workspace_id: receipt.workspace_id,
    project_id: receipt.project_id,
    fingerprint: receipt.integrity.fingerprint,
    idempotency_key: receipt.idempotency_key,
    payload: receipt,
    created_at: receipt.recorded_at,
  });
}

function insertContextUseReviewRecord(
  db: Database.Database,
  review: ContextUseReviewV01,
): void {
  insertVNextCoreRecordV01(db, {
    record_kind: "context_use_review",
    record_id: review.review_id,
    workspace_id: review.workspace_id,
    project_id: review.project_id,
    fingerprint: review.integrity.fingerprint,
    idempotency_key: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        negative_fixture_review_id: review.review_id,
      }),
    ),
    payload: review,
    created_at: review.reviewed_at,
  });
}

function mutatePayloadForLineageTest(
  db: Database.Database,
  recordKind: VNextCoreRecordEnvelopeV01["record_kind"],
  recordId: string,
  mutate: (payload: Record<string, unknown>) => void,
): void {
  mutateCoreRecordForLineageTest(db, recordKind, recordId, () => {
    const row = db
      .prepare(
        `SELECT payload_json FROM vnext_core_records
         WHERE record_kind = ? AND record_id = ?`,
      )
      .get(recordKind, recordId) as { payload_json: string } | undefined;
    assert(row);
    const payload = JSON.parse(row.payload_json) as Record<string, unknown>;
    mutate(payload);
    db.prepare(
      `UPDATE vnext_core_records SET payload_json = ?
       WHERE record_kind = ? AND record_id = ?`,
    ).run(canonicalizeProtocolValueV01(payload), recordKind, recordId);
  });
}

function mutateCoreRecordForLineageTest(
  db: Database.Database,
  recordKind: VNextCoreRecordEnvelopeV01["record_kind"],
  recordId: string,
  mutate: () => void,
): void {
  const trigger = db
    .prepare(
      `SELECT sql FROM sqlite_master
       WHERE type = 'trigger' AND name = 'trg_vnext_core_records_immutable_update'`,
    )
    .get() as { sql: string } | undefined;
  assert(trigger?.sql);
  db.exec("DROP TRIGGER trg_vnext_core_records_immutable_update");
  try {
    assert.equal(
      Number(
        (
          db
            .prepare(
              `SELECT COUNT(*) AS count FROM vnext_core_records
               WHERE record_kind = ? AND record_id = ?`,
            )
            .get(recordKind, recordId) as { count: number }
        ).count,
      ),
      1,
    );
    mutate();
  } finally {
    db.exec(trigger.sql);
  }
}

function assertDecisionProvenanceCoverage(input: {
  config: VNextLocalOperatorPilotConfigV01;
  clock: ManualClock;
  secretSource: VNextLocalOperatorSecretSourceV01;
  jar: RouteCookieJar;
  proposal: EpisodeDeltaProposalV01;
  decision: ReviewDecisionV01;
  request: VNextOperatorPilotDecisionRequestV01;
}): void {
  const db = openVNextLocalOperatorDatabaseV01(input.config);
  try {
    const credential = readVNextLocalOperatorCredentialFromRequestV01(
      routeRequest("/api/vnext/operator/semantic-review", {
        method: "GET",
        jar: input.jar,
      }),
    );
    const session = readVNextLocalOperatorSessionHistoryV01(db, {
      session_id: credential.session_id,
    });
    assert(session?.bootstrap_consumed_at);
    const exact = validateVNextOperatorPilotReviewDecisionProvenanceV01(db, {
      config: input.config,
      proposal: input.proposal,
      decision: input.decision,
      authenticated_session_id: session.session_id,
    });
    assert.equal(exact.status, "valid");
    assert.equal(exact.pilot_session_bound, true);
    assert.equal(exact.pilot_actionable, true);
    assert.equal(exact.session_id, session.session_id);
    assert.equal(
      exact.request_fingerprint,
      createVNextOperatorPilotDecisionRequestFingerprintV01(
        input.config,
        session.session_id,
        input.request,
      ),
    );
    pass("exact_operator_session_bound_accept_decision_validated");

    for (const decisionValue of ["reject", "defer"] as const) {
      const request: VNextOperatorPilotDecisionRequestV01 = {
        ...input.request,
        decision: decisionValue,
        rationale_summary: `Synthetic ${decisionValue} provenance validation.`,
        revisit:
          decisionValue === "defer"
            ? { condition_summary: "Revisit after bounded source review." }
            : null,
      };
      const basis =
        createVNextOperatorPilotReviewDecisionSessionBasisRefV01(
          input.config,
          session,
          request,
          input.decision.decided_at,
        );
      const decision = rebuildDecisionForSmoke(input.decision, {
        decision: decisionValue,
        actor_ref: {
          ...input.decision.actor_ref,
          observed_at: input.decision.decided_at,
          source_ref: basis.source_ref,
        },
        authorization_basis_refs: [basis],
        rationale_summary: request.rationale_summary,
        revisit:
          decisionValue === "defer"
            ? {
                revisit_at: addIsoMillisecondsV01(
                  input.decision.decided_at,
                  24 * 60 * 60 * 1000,
                ),
                expires_at: addIsoMillisecondsV01(
                  input.decision.decided_at,
                  7 * 24 * 60 * 60 * 1000,
                ),
                condition_summary: request.revisit!.condition_summary,
              }
            : null,
        requested_transition_intent: null,
        compatibility: {
          ...input.decision.compatibility,
          external_refs: [basis],
        },
      });
      withRolledBackCoreRecord(db, decision, {
        idempotency_key:
          createVNextOperatorPilotDecisionRequestFingerprintV01(
            input.config,
            session.session_id,
            request,
          ),
        run: () => {
          const validation =
            validateVNextOperatorPilotReviewDecisionProvenanceV01(db, {
              config: input.config,
              proposal: input.proposal,
              decision,
              authenticated_session_id: session.session_id,
            });
          assert.equal(validation.status, "valid");
          assert.equal(validation.pilot_session_bound, true);
          assert.equal(validation.pilot_actionable, false);
        },
      });
      pass(`exact_operator_session_bound_${decisionValue}_decision_validated`);
    }

    const operatorBConfig = {
      ...input.config,
      operator_id: "operator:operator-pilot-smoke-b",
    };
    const operatorBIssue = issueVNextLocalOperatorBootstrapV01(db, {
      config: operatorBConfig,
      clock: input.clock,
      secret_source: input.secretSource,
    });
    rememberCredentialMaterial(operatorBIssue.bootstrap_token);
    const operatorBAdmission = consumeVNextLocalOperatorBootstrapV01(db, {
      config: operatorBConfig,
      bootstrap_token: operatorBIssue.bootstrap_token,
      clock: input.clock,
      secret_source: input.secretSource,
    });
    rememberCredentialMaterial(operatorBAdmission.credential.session_secret);
    rememberCredentialMaterial(operatorBAdmission.credential.action_nonce);
    const operatorBBasis =
      createVNextOperatorPilotReviewDecisionSessionBasisRefV01(
        operatorBConfig,
        operatorBAdmission.session,
        input.request,
        input.decision.decided_at,
      );
    const operatorBDecision = rebuildDecisionForSmoke(input.decision, {
      actor_ref: {
        ...input.decision.actor_ref,
        external_id: operatorBConfig.operator_id,
        source_ref: operatorBBasis.source_ref,
      },
      authorization_basis_refs: [operatorBBasis],
      compatibility: {
        ...input.decision.compatibility,
        external_refs: [operatorBBasis],
      },
    });
    assertGenericDecision(input.proposal, operatorBDecision);
    withRolledBackCoreRecord(db, operatorBDecision, {
      idempotency_key: null,
      run: () => {
        const read = readVNextOperatorPilotSemanticReviewV01(db, {
          config: input.config,
          proposal_id: input.proposal.proposal_id,
          authenticated_session_id: session.session_id,
        });
        const history = read.decision_history.find(
          (item) => item.decision.decision_id === operatorBDecision.decision_id,
        );
        assert(history);
        assert.equal(history.pilot_session_bound, false);
        assert.equal(history.pilot_actionable, false);
        assert.throws(
          () =>
            prepareVNextOperatorPilotSemanticCommitPreviewV01(db, {
              config: input.config,
              credential,
              request: {
                proposal_id: input.proposal.proposal_id,
                proposal_fingerprint: input.proposal.integrity.fingerprint,
                decision_id: operatorBDecision.decision_id,
                decision_fingerprint:
                  operatorBDecision.integrity.fingerprint,
              },
              clock: input.clock,
            }),
          /operator_pilot_decision_session_provenance_invalid/,
        );
      },
    });
    pass("generic_decision_visible_as_non_actionable_history");
    reject("session_a_actor_b_decision_preview_rejected");
    reject("decision_actor_external_id_scope_mismatch_rejected");

    const genericBasis = {
      ...input.decision.authorization_basis_refs[0]!,
      ref_type: "generic_operator_assertion",
      external_id: "generic-operator-assertion:smoke",
      trust_class: "user_declaration" as const,
      source_ref: `sha256:${"4".repeat(64)}`,
      compatibility_namespace: "augnes.generic-review.v0.1",
    };
    const genericActor = {
      ...input.decision.actor_ref,
      source_ref: genericBasis.source_ref,
      compatibility_namespace: "augnes.generic-review.v0.1",
    };
    const genericDecision = rebuildDecisionForSmoke(input.decision, {
      actor_ref: genericActor,
      authorization_basis_refs: [genericBasis],
      compatibility: {
        ...input.decision.compatibility,
        external_refs: [genericBasis],
      },
    });
    assertGenericDecision(input.proposal, genericDecision);
    assertInvalidDecisionProvenance(
      db,
      input.config,
      input.proposal,
      genericDecision,
      "operator_pilot_decision_session_basis_invalid",
    );
    reject("generic_accept_without_session_basis_rejected");

    const modifiedBasis = {
      ...input.decision.authorization_basis_refs[0]!,
      source_ref: `sha256:${"5".repeat(64)}`,
    };
    const resignedBasisMutation = rebuildDecisionForSmoke(input.decision, {
      actor_ref: {
        ...input.decision.actor_ref,
        source_ref: modifiedBasis.source_ref,
      },
      authorization_basis_refs: [modifiedBasis],
      compatibility: {
        ...input.decision.compatibility,
        external_refs: [modifiedBasis],
      },
    });
    assertGenericDecision(input.proposal, resignedBasisMutation);
    assertInvalidDecisionProvenance(
      db,
      input.config,
      input.proposal,
      resignedBasisMutation,
      "operator_pilot_decision_session_basis_mismatch",
    );
    reject("resigned_modified_session_basis_source_ref_rejected");
    reject("forged_operator_actor_ref_rejected");

    const unconsumedIssue = issueVNextLocalOperatorBootstrapV01(db, {
      config: input.config,
      clock: input.clock,
      secret_source: input.secretSource,
    });
    rememberCredentialMaterial(unconsumedIssue.bootstrap_token);
    const unconsumedBasis =
      createVNextOperatorPilotReviewDecisionSessionBasisRefV01(
        input.config,
        unconsumedIssue.session,
        input.request,
        input.decision.decided_at,
      );
    const unconsumedDecision = rebuildDecisionForSmoke(input.decision, {
      actor_ref: {
        ...input.decision.actor_ref,
        source_ref: unconsumedBasis.source_ref,
      },
      authorization_basis_refs: [unconsumedBasis],
      compatibility: {
        ...input.decision.compatibility,
        external_refs: [unconsumedBasis],
      },
    });
    assertInvalidDecisionProvenance(
      db,
      input.config,
      input.proposal,
      unconsumedDecision,
      "operator_pilot_decision_session_bootstrap_unconsumed",
    );
    reject("never_consumed_bootstrap_session_decision_rejected");

    withSessionRowMutation(
      db,
      session.session_id,
      "revoked_at = ?",
      ["2026-07-11T08:59:59.000Z"],
      () =>
        assertInvalidDecisionProvenance(
          db,
          input.config,
          input.proposal,
          input.decision,
          "operator_pilot_decision_after_session_revocation",
        ),
    );
    reject("session_revoked_before_decision_time_rejected");
    withSessionRowMutation(
      db,
      session.session_id,
      "operator_id = ?",
      ["operator:foreign-session"],
      () =>
        assertInvalidDecisionProvenance(
          db,
          input.config,
          input.proposal,
          input.decision,
          "operator_pilot_decision_session_scope_mismatch",
        ),
    );
    reject("foreign_workspace_project_operator_session_rejected");

    const nullIntent = rebuildDecisionForSmoke(input.decision, {
      requested_transition_intent: null,
    });
    assertGenericDecision(input.proposal, nullIntent);
    assertInvalidDecisionProvenance(
      db,
      input.config,
      input.proposal,
      nullIntent,
      "operator_pilot_decision_transition_intent_invalid",
    );
    reject("accept_null_transition_intent_rejected");

    const otherIntent = rebuildDecisionForSmoke(input.decision, {
      requested_transition_intent: {
        ...input.decision.requested_transition_intent!,
        transition_kind: "other",
      },
    });
    assertGenericDecision(input.proposal, otherIntent);
    assertInvalidDecisionProvenance(
      db,
      input.config,
      input.proposal,
      otherIntent,
      "operator_pilot_decision_transition_intent_invalid",
    );
    reject("accept_transition_kind_other_rejected");

    const trapRequest: VNextOperatorPilotDecisionRequestV01 = {
      ...input.request,
      rationale_summary:
        "Generic decision must not be captured as an exact canonical replay.",
    };
    const trapDecision = rebuildDecisionForSmoke(genericDecision, {
      rationale_summary: trapRequest.rationale_summary,
    });
    assertGenericDecision(input.proposal, trapDecision);
    withRolledBackCoreRecord(db, trapDecision, {
      idempotency_key:
        createVNextOperatorPilotDecisionRequestFingerprintV01(
          input.config,
          session.session_id,
          trapRequest,
        ),
      run: () => {
        assert.throws(
          () =>
            recordVNextOperatorPilotReviewDecisionV01(db, {
              config: input.config,
              credential,
              request: trapRequest,
              clock: input.clock,
              secret_source: input.secretSource,
            }),
          /operator_pilot_decision_replay_conflict/,
        );
      },
    });
    reject("generic_decision_not_captured_as_exact_operator_replay");
  } finally {
    db.close();
  }
}

async function assertCrossSessionDecisionReplayAndActionability(input: {
  environment: NodeJS.ProcessEnv;
  clock: ManualClock;
  secretSource: VNextLocalOperatorSecretSourceV01;
  sourceJar: RouteCookieJar;
  proposal: EpisodeDeltaProposalV01;
  priorDecision: ReviewDecisionV01;
  request: VNextOperatorPilotDecisionRequestV01;
}): Promise<void> {
  copyFileSync(canonicalDbPath, crossSessionReplayDbPath);
  const environment = {
    ...input.environment,
    AUGNES_DB_PATH: crossSessionReplayDbPath,
  };
  const config = readVNextLocalOperatorPilotConfigV01(environment);
  const sessionHandlers = createVNextLocalOperatorSessionHandlersV01({
    environment,
    clock: input.clock,
    secret_source: input.secretSource,
  });
  const reviewHandlers = createVNextOperatorSemanticReviewHandlersV01({
    environment,
    clock: input.clock,
    secret_source: input.secretSource,
  });
  const transitionHandlers = createVNextOperatorSemanticTransitionHandlersV01({
    environment,
    clock: input.clock,
    secret_source: input.secretSource,
  });
  const priorSessionId =
    input.priorDecision.authorization_basis_refs[0]?.external_id;
  assert(priorSessionId);

  try {
    const priorJar = new RouteCookieJar();
    priorJar.setPair(input.sourceJar.header());
    input.clock.set("2026-07-11T09:01:00.000Z");
    const revokeResponse = await sessionHandlers.POST(
      routeRequest("/api/vnext/operator/session", {
        method: "POST",
        jar: priorJar,
        body: { action: "logout" },
      }),
    );
    assert.equal(revokeResponse.status, 200);

    input.clock.set("2026-07-11T09:02:00.000Z");
    const nextBootstrap = issueBootstrap(
      environment,
      input.clock,
      input.secretSource,
    );
    rememberCredentialMaterial(nextBootstrap.bootstrap_token);
    const nextExchange = await bootstrapThroughRoute(
      sessionHandlers,
      nextBootstrap.bootstrap_token,
    );
    assert.equal(nextExchange.response.status, 200);
    const nextJar = new RouteCookieJar();
    nextJar.setPair(nextExchange.cookiePair);
    const nextCredential = readVNextLocalOperatorCredentialFromRequestV01(
      routeRequest("/api/vnext/operator/semantic-review", {
        method: "GET",
        jar: nextJar,
      }),
    );
    assert.notEqual(nextCredential.session_id, priorSessionId);

    const historyBefore = await reviewHandlers.GET(
      routeRequest("/api/vnext/operator/semantic-review", {
        method: "GET",
        jar: nextJar,
        query: { proposal_id: input.proposal.proposal_id },
      }),
    );
    assert.equal(historyBefore.status, 200);
    const historyBeforeBody = await publicJson(historyBefore);
    const priorClassification = (
      historyBeforeBody.proposal as VNextOperatorPilotReviewDetailV01
    ).decision_history.find(
      (item) => item.decision.decision_id === input.priorDecision.decision_id,
    );
    assert.equal(priorClassification?.pilot_session_bound, true);
    assert.equal(priorClassification?.pilot_actionable, false);
    pass("historical_session_decision_visible_but_not_currently_actionable");

    input.clock.set("2026-07-11T09:03:00.000Z");
    const nextDecisionResponse = await reviewHandlers.POST(
      routeRequest("/api/vnext/operator/semantic-review", {
        method: "POST",
        jar: nextJar,
        body: { ...input.request },
      }),
    );
    const nextDecisionBody = await publicJson(nextDecisionResponse);
    assert.equal(
      nextDecisionResponse.status,
      201,
      String(nextDecisionBody.error_code ?? nextDecisionBody.status),
    );
    assert.equal(nextDecisionBody.status, "inserted");
    nextJar.absorb(nextDecisionResponse);
    const nextDecision = nextDecisionBody.decision as ReviewDecisionV01;
    assert.notEqual(nextDecision.decision_id, input.priorDecision.decision_id);
    pass("new_session_records_same_semantic_decision_as_new_history");
    reject("new_session_does_not_replay_prior_session_decision");

    const priorRequestFingerprint =
      createVNextOperatorPilotDecisionRequestFingerprintV01(
        config,
        priorSessionId,
        input.request,
      );
    const nextRequestFingerprint =
      createVNextOperatorPilotDecisionRequestFingerprintV01(
        config,
        nextCredential.session_id,
        input.request,
      );
    assert.notEqual(priorRequestFingerprint, nextRequestFingerprint);
    const persistedDecisionRows = new Database(crossSessionReplayDbPath, {
      readonly: true,
      fileMustExist: true,
    });
    try {
      const rows = persistedDecisionRows.prepare(
        `SELECT record_id, idempotency_key FROM vnext_core_records
         WHERE workspace_id = ? AND project_id = ?
           AND record_kind = 'review_decision'
         ORDER BY created_at, record_id`,
      ).all(config.workspace_id, config.project_id) as Array<{
        record_id: string;
        idempotency_key: string | null;
      }>;
      assert.equal(rows.length, 2);
      assert(rows.some((row) => row.idempotency_key === priorRequestFingerprint));
      assert(rows.some((row) => row.idempotency_key === nextRequestFingerprint));
    } finally {
      persistedDecisionRows.close();
    }
    pass("session_scoped_decision_idempotency_keys_are_distinct");

    const nextReplayResponse = await reviewHandlers.POST(
      routeRequest("/api/vnext/operator/semantic-review", {
        method: "POST",
        jar: nextJar,
        body: { ...input.request },
      }),
    );
    const nextReplayBody = await publicJson(nextReplayResponse);
    assert.equal(nextReplayResponse.status, 200);
    assert.equal(nextReplayBody.status, "exact_replay");
    assert.equal(
      (nextReplayBody.decision as ReviewDecisionV01).decision_id,
      nextDecision.decision_id,
    );
    nextJar.absorb(nextReplayResponse);
    assert.equal(countProjectRecordKindRows(
      crossSessionReplayDbPath,
      config,
      "review_decision",
    ), 2);
    pass("same_active_session_replay_persists_one_decision_row");

    const classified = await reviewHandlers.GET(
      routeRequest("/api/vnext/operator/semantic-review", {
        method: "GET",
        jar: nextJar,
        query: { proposal_id: input.proposal.proposal_id },
      }),
    );
    const classifiedBody = await publicJson(classified);
    const classifiedHistory = (
      classifiedBody.proposal as VNextOperatorPilotReviewDetailV01
    ).decision_history;
    assert.equal(classifiedHistory.length, 2);
    assert.equal(
      classifiedHistory.find(
        (item) => item.decision.decision_id === input.priorDecision.decision_id,
      )?.pilot_actionable,
      false,
    );
    assert.equal(
      classifiedHistory.find(
        (item) => item.decision.decision_id === nextDecision.decision_id,
      )?.pilot_actionable,
      true,
    );
    assert.equal(
      classifiedHistory.filter((item) => item.pilot_actionable).length,
      1,
    );
    pass("active_session_decision_alone_is_actionable");

    await expectRouteError(
      await transitionHandlers.GET(
        routeRequest("/api/vnext/operator/semantic-transition", {
          method: "GET",
          jar: nextJar,
          query: decisionBinding(input.proposal, input.priorDecision),
        }),
      ),
      409,
      "operator_pilot_decision_session_mismatch",
      "new_session_preview_of_historical_decision_rejected",
    );

    input.clock.set("2026-07-11T09:04:00.000Z");
    const nextBinding = decisionBinding(input.proposal, nextDecision);
    const previewResponse = await transitionHandlers.GET(
      routeRequest("/api/vnext/operator/semantic-transition", {
        method: "GET",
        jar: nextJar,
        query: nextBinding,
      }),
    );
    const previewBody = await publicJson(previewResponse);
    assert.equal(previewResponse.status, 200);
    nextJar.absorb(previewResponse);
    const preview = previewBody.preview as VNextSemanticCommitPreviewV01;

    input.clock.set("2026-07-11T09:05:00.000Z");
    const confirmResponse = await transitionHandlers.POST(
      routeRequest("/api/vnext/operator/semantic-transition", {
        method: "POST",
        jar: nextJar,
        body: {
          action: "confirm",
          ...nextBinding,
          confirmation_digest: preview.confirmation_digest,
        },
      }),
    );
    const confirmBody = await publicJson(confirmResponse);
    assert.equal(
      confirmResponse.status,
      201,
      String(confirmBody.error_code ?? confirmBody.status),
    );
    nextJar.absorb(confirmResponse);
    const gate = confirmBody.gate_record as VNextSemanticCommitGateRecordV01;

    input.clock.set("2026-07-11T09:06:00.000Z");
    const commitResponse = await transitionHandlers.POST(
      routeRequest("/api/vnext/operator/semantic-transition", {
        method: "POST",
        jar: nextJar,
        body: {
          action: "commit",
          ...nextBinding,
          gate_record_id: gate.gate_record_id,
          gate_record_fingerprint: gate.integrity.fingerprint,
        },
      }),
    );
    const commitBody = await publicJson(commitResponse);
    assert.equal(
      commitResponse.status,
      201,
      String(commitBody.error_code ?? commitBody.status),
    );
    assert.equal(commitBody.status, "applied");
    nextJar.absorb(commitResponse);
    pass("new_session_decision_previews_confirms_and_commits");
  } finally {
    input.clock.set("2026-07-11T09:00:00.000Z");
  }
}

function decisionBinding(
  proposal: EpisodeDeltaProposalV01,
  decision: ReviewDecisionV01,
): {
  proposal_id: string;
  proposal_fingerprint: string;
  decision_id: string;
  decision_fingerprint: string;
} {
  return {
    proposal_id: proposal.proposal_id,
    proposal_fingerprint: proposal.integrity.fingerprint,
    decision_id: decision.decision_id,
    decision_fingerprint: decision.integrity.fingerprint,
  };
}

function countProjectRecordKindRows(
  databasePath: string,
  config: VNextLocalOperatorPilotConfigV01,
  recordKind: string,
): number {
  const db = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    return Number(
      (
        db.prepare(
          `SELECT COUNT(*) AS count FROM vnext_core_records
           WHERE workspace_id = ? AND project_id = ? AND record_kind = ?`,
        ).get(config.workspace_id, config.project_id, recordKind) as {
          count: number;
        }
      ).count,
    );
  } finally {
    db.close();
  }
}

function rebuildDecisionForSmoke(
  base: ReviewDecisionV01,
  overrides: Partial<
    Pick<
      ReviewDecisionV01,
      | "decision"
      | "actor_ref"
      | "authorization_basis_refs"
      | "rationale_summary"
      | "revisit"
      | "requested_transition_intent"
      | "compatibility"
    >
  >,
): ReviewDecisionV01 {
  return buildReviewDecisionV01({
    workspace_id: base.workspace_id,
    project_id: base.project_id,
    source_proposal: base.source_proposal,
    candidate: base.candidate,
    decision: overrides.decision ?? base.decision,
    actor_ref: overrides.actor_ref ?? base.actor_ref,
    authorization_basis_refs:
      overrides.authorization_basis_refs ?? base.authorization_basis_refs,
    decision_basis_material_ids: base.decision_basis_material_ids,
    decision_basis_refs: base.decision_basis_refs,
    rationale_summary: overrides.rationale_summary ?? base.rationale_summary,
    decided_at: base.decided_at,
    revisit: Object.hasOwn(overrides, "revisit")
      ? overrides.revisit ?? null
      : base.revisit,
    requested_transition_intent: Object.hasOwn(
      overrides,
      "requested_transition_intent",
    )
      ? overrides.requested_transition_intent ?? null
      : base.requested_transition_intent,
    lineage: base.lineage,
    compatibility: overrides.compatibility ?? base.compatibility,
    authority_notes: base.authority_summary.notes,
  });
}

function assertGenericDecision(
  proposal: EpisodeDeltaProposalV01,
  decision: ReviewDecisionV01,
): void {
  assert.equal(validateReviewDecisionV01(decision).status, "valid");
  assert.equal(
    validateReviewDecisionAgainstEpisodeDeltaProposalV01(decision, proposal)
      .status,
    "valid",
  );
}

function assertInvalidDecisionProvenance(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  proposal: EpisodeDeltaProposalV01,
  decision: ReviewDecisionV01,
  expectedCode: string,
): void {
  const validation = validateVNextOperatorPilotReviewDecisionProvenanceV01(
    db,
    {
      config,
      proposal,
      decision,
      authenticated_session_id: null,
    },
  );
  assert.equal(validation.status, "invalid");
  assert(validation.errors.includes(expectedCode), validation.errors.join(","));
}

function withRolledBackCoreRecord(
  db: Database.Database,
  decision: ReviewDecisionV01,
  input: { idempotency_key: string | null; run: () => void },
): void {
  db.exec("BEGIN IMMEDIATE");
  try {
    insertVNextCoreRecordV01(db, {
      record_kind: "review_decision",
      record_id: decision.decision_id,
      workspace_id: decision.workspace_id,
      project_id: decision.project_id,
      fingerprint: decision.integrity.fingerprint,
      idempotency_key: input.idempotency_key,
      payload: decision,
      created_at: decision.decided_at,
    });
    input.run();
  } finally {
    if (db.inTransaction) db.exec("ROLLBACK");
  }
}

function withSessionRowMutation(
  db: Database.Database,
  sessionId: string,
  assignment: string,
  values: unknown[],
  run: () => void,
): void {
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare(
      `UPDATE vnext_local_operator_sessions SET ${assignment} WHERE session_id = ?`,
    ).run(...values, sessionId);
    run();
  } finally {
    if (db.inTransaction) db.exec("ROLLBACK");
  }
}

function assertGenericGateCommitBypassRejected(input: {
  config: VNextLocalOperatorPilotConfigV01;
  clock: ManualClock;
  secretSource: VNextLocalOperatorSecretSourceV01;
  jar: RouteCookieJar;
  proposal: EpisodeDeltaProposalV01;
  decision: ReviewDecisionV01;
  preview: VNextSemanticCommitPreviewV01;
}): void {
  const db = openVNextLocalOperatorDatabaseV01(input.config);
  db.exec("BEGIN IMMEDIATE");
  try {
    const generic =
      recordVNextSemanticCommitAuthorizationInsideTransactionV01(db, {
        preview: input.preview,
        confirmation_digest: input.preview.confirmation_digest,
        operator_actor_ref: input.decision.actor_ref,
        clock: input.clock,
      });
    assert.equal(
      generic.gate_record.operator_confirmation_basis_refs,
      undefined,
    );
    const provenance =
      validateVNextOperatorPilotSemanticGateConfirmationProvenanceV01(db, {
        config: input.config,
        proposal: input.proposal,
        decision: input.decision,
        gate: generic.gate_record,
      });
    assert.equal(provenance.status, "invalid");
    assert(
      provenance.errors.includes(
        "operator_pilot_gate_confirmation_basis_required",
      ),
    );
    const credential = readVNextLocalOperatorCredentialFromRequestV01(
      routeRequest("/api/vnext/operator/semantic-transition", {
        method: "GET",
        jar: input.jar,
      }),
    );
    assert.throws(
      () =>
        commitVNextOperatorPilotSemanticTransitionV01(db, {
          config: input.config,
          credential,
          request: {
            proposal_id: input.preview.proposal_id,
            proposal_fingerprint: input.preview.proposal_fingerprint,
            decision_id: input.preview.decision_id,
            decision_fingerprint: input.preview.decision_fingerprint,
            gate_record_id: generic.gate_record.gate_record_id,
            gate_record_fingerprint:
              generic.gate_record.integrity.fingerprint,
          },
          clock: input.clock,
          secret_source: input.secretSource,
        }),
      /operator_pilot_gate_confirmation_provenance_invalid/,
    );
  } finally {
    if (db.inTransaction) db.exec("ROLLBACK");
    db.close();
  }
  reject("generic_commit_gate_without_operator_confirmation_basis_rejected");
  reject("direct_commit_api_bypass_with_generic_gate_rejected");
}

function assertGateProvenanceCoverage(input: {
  config: VNextLocalOperatorPilotConfigV01;
  proposal: EpisodeDeltaProposalV01;
  decision: ReviewDecisionV01;
  gate: VNextSemanticCommitGateRecordV01;
  requiredSessionId: string;
}): void {
  const db = openVNextLocalOperatorDatabaseV01(input.config);
  try {
    const exact =
      validateVNextOperatorPilotSemanticGateConfirmationProvenanceV01(db, {
        config: input.config,
        proposal: input.proposal,
        decision: input.decision,
        gate: input.gate,
        required_session_id: input.requiredSessionId,
      });
    assert.equal(exact.status, "valid");
    assert.equal(exact.session_id, input.requiredSessionId);
    pass("exact_session_bound_confirmation_gate_validated");
    pass("decision_confirmation_commit_same_session_policy_validated");

    const withoutBasis = resignGateForSmoke(input.gate, (gate) => {
      delete gate.operator_confirmation_basis_refs;
    });
    assertInvalidGateProvenance(
      db,
      input,
      withoutBasis,
      "operator_pilot_gate_confirmation_basis_required",
    );
    reject("generic_gate_without_operator_confirmation_basis_rejected");

    const foreignSession = db.prepare(
      `SELECT session_id FROM vnext_local_operator_sessions
       WHERE workspace_id = ? AND project_id = ? AND operator_id <> ?
       ORDER BY issued_at, session_id LIMIT 1`,
    ).get(
      input.config.workspace_id,
      input.config.project_id,
      input.config.operator_id,
    ) as { session_id: string } | undefined;
    assert(foreignSession);
    const differentSession = resignGateForSmoke(input.gate, (gate) => {
      gate.operator_confirmation_basis_refs = [
        {
          ...gate.operator_confirmation_basis_refs![0]!,
          external_id: foreignSession.session_id,
        },
      ];
    });
    assertInvalidGateProvenance(
      db,
      input,
      differentSession,
      "operator_pilot_gate_session_continuity_mismatch",
    );
    reject("confirmation_session_differs_from_decision_session_rejected");
    reject("foreign_confirmation_operator_session_rejected");

    const digestMismatch = resignGateForSmoke(input.gate, (gate) => {
      gate.operator_confirmation_basis_refs = [
        {
          ...gate.operator_confirmation_basis_refs![0]!,
          source_ref: `sha256:${"6".repeat(64)}`,
        },
      ];
    });
    assertInvalidGateProvenance(
      db,
      input,
      digestMismatch,
      "operator_pilot_gate_confirmation_basis_mismatch",
    );
    reject("confirmation_digest_basis_mismatch_rejected");
    reject("fully_resigned_forged_confirmation_basis_rejected");

    const applierMismatch = resignGateForSmoke(input.gate, (gate) => {
      gate.semantic_commit_gate_evaluation.authorized_applier_ref = {
        ...gate.semantic_commit_gate_evaluation.authorized_applier_ref,
        external_id: "operator:unauthorized-applier",
      };
    });
    assertInvalidGateProvenance(
      db,
      input,
      applierMismatch,
      "operator_pilot_gate_authorized_applier_mismatch",
    );
    reject("confirmation_authorized_applier_mismatch_rejected");

    const ttlMismatch = resignGateForSmoke(input.gate, (gate) => {
      gate.semantic_commit_gate_evaluation.expires_at = new Date(
        Date.parse(gate.semantic_commit_gate_evaluation.expires_at) + 1_000,
      ).toISOString();
    });
    assertInvalidGateProvenance(
      db,
      input,
      ttlMismatch,
      "operator_pilot_gate_ttl_mismatch",
    );
    reject("confirmation_gate_ttl_mismatch_rejected");

    const session = readVNextLocalOperatorSessionHistoryV01(db, {
      session_id: input.requiredSessionId,
    });
    assert(session);
    const outsideTime = new Date(
      Date.parse(session.expires_at) + 1_000,
    ).toISOString();
    const outsideLifetime = resignGateForSmoke(input.gate, (gate) => {
      gate.confirmed_at = outsideTime;
      gate.operator_confirmation_basis_refs = [
        createVNextOperatorPilotSemanticConfirmationBasisRefV01({
          config: input.config,
          session_id: input.requiredSessionId,
          proposal_id: gate.proposal_id,
          proposal_fingerprint: gate.proposal_fingerprint,
          decision_id: gate.decision_id,
          decision_fingerprint: gate.decision_fingerprint,
          confirmation_digest: gate.confirmation_digest,
          authorized_applier_identity: {
            ref_type:
              gate.semantic_commit_gate_evaluation.authorized_applier_ref
                .ref_type,
            external_id:
              gate.semantic_commit_gate_evaluation.authorized_applier_ref
                .external_id,
          },
          gate_ttl_ms: 10 * 60 * 1000,
          confirmed_at: outsideTime,
        }),
      ];
    });
    assertInvalidGateProvenance(
      db,
      input,
      outsideLifetime,
      "operator_pilot_gate_confirmation_outside_session_lifetime",
    );
    reject("confirmation_timestamp_outside_session_lifetime_rejected");
  } finally {
    db.close();
  }
}

function assertInvalidGateProvenance(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    proposal: EpisodeDeltaProposalV01;
    decision: ReviewDecisionV01;
    requiredSessionId: string;
  },
  gate: VNextSemanticCommitGateRecordV01,
  expectedCode: string,
): void {
  const validation =
    validateVNextOperatorPilotSemanticGateConfirmationProvenanceV01(db, {
      config: input.config,
      proposal: input.proposal,
      decision: input.decision,
      gate,
      required_session_id: input.requiredSessionId,
    });
  assert.equal(validation.status, "invalid");
  assert(validation.errors.includes(expectedCode), validation.errors.join(","));
}

function resignGateForSmoke(
  gate: VNextSemanticCommitGateRecordV01,
  mutate: (gate: VNextSemanticCommitGateRecordV01) => void,
): VNextSemanticCommitGateRecordV01 {
  const value = structuredClone(gate);
  mutate(value);
  value.integrity.fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      ...value,
      integrity: { ...value.integrity, fingerprint: undefined },
    }),
  );
  return value;
}

type OperatorPilotRouteHandlerV01 = (
  request: Request,
) => Response | Promise<Response>;

async function startOperatorPilotLoopbackHarness(input: {
  session: ReturnType<typeof createVNextLocalOperatorSessionHandlersV01>;
  semanticReview: ReturnType<
    typeof createVNextOperatorSemanticReviewHandlersV01
  >;
  semanticTransition: ReturnType<
    typeof createVNextOperatorSemanticTransitionHandlersV01
  >;
  packetHandoff: ReturnType<
    typeof createVNextOperatorPacketHandoffHandlerV01
  >;
  projectContinuity: ReturnType<
    typeof createVNextOperatorProjectContinuityHandlerV01
  >;
  laterResult: ReturnType<typeof createVNextOperatorLaterResultHandlersV01>;
  contextUseReview: ReturnType<
    typeof createVNextOperatorContextUseReviewHandlersV01
  >;
}): Promise<{
  origin: string;
  requests: Array<{ method: string; pathname: string }>;
  forward: OperatorPilotRouteHandlerV01;
  close: () => Promise<void>;
}> {
  const routes = new Map<string, OperatorPilotRouteHandlerV01>([
    ["GET /api/vnext/operator/session", input.session.GET],
    ["POST /api/vnext/operator/session", input.session.POST],
    ["GET /api/vnext/operator/semantic-review", input.semanticReview.GET],
    ["POST /api/vnext/operator/semantic-review", input.semanticReview.POST],
    [
      "GET /api/vnext/operator/semantic-transition",
      input.semanticTransition.GET,
    ],
    [
      "POST /api/vnext/operator/semantic-transition",
      input.semanticTransition.POST,
    ],
    ["GET /api/vnext/operator/packet-handoff", input.packetHandoff],
    [
      "GET /api/vnext/operator/project-continuity",
      input.projectContinuity,
    ],
    ["GET /api/vnext/operator/later-result", input.laterResult.GET],
    ["POST /api/vnext/operator/later-result", input.laterResult.POST],
    [
      "GET /api/vnext/operator/context-use-review",
      input.contextUseReview.GET,
    ],
    [
      "POST /api/vnext/operator/context-use-review",
      input.contextUseReview.POST,
    ],
  ]);
  const requests: Array<{ method: string; pathname: string }> = [];
  const server = createServer(async (incoming, outgoing) => {
    try {
      const host = incoming.headers.host ?? "127.0.0.1";
      const requestUrl = new URL(incoming.url ?? "/", `http://${host}`);
      const method = incoming.method ?? "GET";
      const handler = routes.get(`${method} ${requestUrl.pathname}`);
      assert(handler, `loopback route missing: ${method} ${requestUrl.pathname}`);
      requests.push({ method, pathname: requestUrl.pathname });

      const chunks: Buffer[] = [];
      for await (const chunk of incoming) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const body = Buffer.concat(chunks);
      const request = new Request(requestUrl, {
        method,
        headers: new Headers(
          Object.entries(incoming.headers).flatMap(([name, value]) =>
            value === undefined
              ? []
              : Array.isArray(value)
                ? value.map((item) => [name, item] as [string, string])
                : [[name, value] as [string, string]],
          ),
        ),
        ...(body.byteLength > 0 ? { body } : {}),
      });
      const response = await handler(request);
      outgoing.statusCode = response.status;
      const responseHeaders = response.headers as Headers & {
        getSetCookie?: () => string[];
      };
      const setCookies = responseHeaders.getSetCookie?.() ?? [];
      response.headers.forEach((value, name) => {
        if (name.toLowerCase() === "set-cookie") return;
        outgoing.setHeader(name, value);
      });
      if (setCookies.length > 0) {
        outgoing.setHeader("set-cookie", setCookies);
      } else {
        const setCookie = response.headers.get("set-cookie");
        if (setCookie) outgoing.setHeader("set-cookie", setCookie);
      }
      outgoing.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      outgoing.statusCode = 500;
      outgoing.setHeader("content-type", "application/json");
      outgoing.end(
        JSON.stringify({
          ok: false,
          error_code: "operator_pilot_loopback_harness_failure",
          message: error instanceof Error ? error.message : "unknown_failure",
        }),
      );
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
  const address = server.address();
  assert(address && typeof address === "object");
  const origin = `http://127.0.0.1:${address.port}`;

  return {
    origin,
    requests,
    forward: async (sourceRequest) => {
      const sourceUrl = new URL(sourceRequest.url);
      const targetUrl = new URL(`${sourceUrl.pathname}${sourceUrl.search}`, origin);
      const headers = new Headers(sourceRequest.headers);
      headers.set("host", targetUrl.host);
      if (headers.get("origin") === "http://127.0.0.1:3000") {
        headers.set("origin", origin);
      }
      const body =
        sourceRequest.method === "GET" || sourceRequest.method === "HEAD"
          ? null
          : Buffer.from(await sourceRequest.clone().arrayBuffer());
      if (body && !headers.has("content-length")) {
        headers.set("content-length", String(body.byteLength));
      }
      return await new Promise<Response>((resolve, reject) => {
        const outgoing = requestHttp(
          targetUrl,
          {
            method: sourceRequest.method,
            headers: Object.fromEntries(headers.entries()),
            agent: false,
          },
          (incoming) => {
            const chunks: Buffer[] = [];
            incoming.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
            incoming.on("end", () => {
              const responseHeaders = new Headers();
              for (let index = 0; index < incoming.rawHeaders.length; index += 2) {
                responseHeaders.append(
                  incoming.rawHeaders[index]!,
                  incoming.rawHeaders[index + 1]!,
                );
              }
              resolve(
                new Response(Buffer.concat(chunks), {
                  status: incoming.statusCode ?? 500,
                  headers: responseHeaders,
                }),
              );
            });
          },
        );
        outgoing.once("error", reject);
        if (body) outgoing.write(body);
        outgoing.end();
      });
    },
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

function assertOperatorLoopbackRouteCoverage(
  requests: Array<{ method: string; pathname: string }>,
): void {
  const observed = new Set(
    requests.map(({ method, pathname }) => `${method} ${pathname}`),
  );
  for (const expected of [
    "POST /api/vnext/operator/session",
    "GET /api/vnext/operator/semantic-review",
    "POST /api/vnext/operator/semantic-review",
    "GET /api/vnext/operator/semantic-transition",
    "POST /api/vnext/operator/semantic-transition",
    "GET /api/vnext/operator/packet-handoff",
    "POST /api/vnext/operator/later-result",
    "GET /api/vnext/operator/later-result",
    "POST /api/vnext/operator/context-use-review",
    "GET /api/vnext/operator/context-use-review",
    "GET /api/vnext/operator/project-continuity",
  ]) {
    assert(observed.has(expected), `missing real loopback request: ${expected}`);
  }
  assert(requests.length >= 20, "full operator route loop must use real HTTP");
  pass("full_operator_route_sequence_exercised_over_real_loopback_http");
}

async function assertTransportAndDisabledRefusals(input: {
  handlers: ReturnType<typeof createVNextLocalOperatorSessionHandlersV01>;
  environment: NodeJS.ProcessEnv;
}): Promise<void> {
  const disabledHandlers = createVNextLocalOperatorSessionHandlersV01({
    environment: { ...input.environment, AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "0" },
  });
  await expectRouteError(
    await disabledHandlers.GET(localGetRequest()),
    404,
    "not_found",
    "disabled_pilot_exposes_no_capability",
  );

  await expectRouteError(
    await input.handlers.GET(
      new Request("http://remote.example/api/vnext/operator/session", {
        headers: { host: "remote.example" },
      }),
    ),
    403,
    "local_operator_host_required",
    "non_loopback_request_rejected",
  );
  const invalidConfigurations: Array<[string, NodeJS.ProcessEnv]> = [
    [
      "missing_scope_remote_host_rejected_first",
      {
        ...input.environment,
        AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: undefined,
      },
    ],
    [
      "invalid_db_remote_host_rejected_first",
      {
        ...input.environment,
        AUGNES_DB_PATH: "relative-implicit.db",
      },
    ],
  ];
  for (const [caseId, environment] of invalidConfigurations) {
    const invalidConfigHandlers =
      createVNextLocalOperatorSessionHandlersV01({ environment });
    await expectRouteError(
      await invalidConfigHandlers.GET(
        new Request("http://remote.example/api/vnext/operator/session", {
          headers: { host: "remote.example" },
        }),
      ),
      403,
      "local_operator_host_required",
      caseId,
    );
  }
  await expectRouteError(
    await input.handlers.GET(
      new Request("http://0.0.0.0:3000/api/vnext/operator/session", {
        headers: { host: "0.0.0.0:3000" },
      }),
    ),
    403,
    "local_operator_host_required",
    "wildcard_bind_host_rejected",
  );
  await expectTransportAcceptedThroughAuthenticationBoundary(
    await input.handlers.GET(
      new Request("http://localhost:3000/api/vnext/operator/session", {
        headers: { host: "localhost:3000" },
      }),
    ),
    "localhost_transport_accepted",
  );
  await expectTransportAcceptedThroughAuthenticationBoundary(
    await input.handlers.GET(
      new Request("http://[::1]:3000/api/vnext/operator/session", {
        headers: { host: "[::1]:3000" },
      }),
    ),
    "ipv6_loopback_transport_accepted",
  );
  await expectTransportAcceptedThroughAuthenticationBoundary(
    await input.handlers.GET(
      new Request("http://localhost:3000/api/vnext/operator/session", {
        headers: {
          host: "127.0.0.1:3000",
          "x-forwarded-for": "127.0.0.1",
          "x-forwarded-host": "127.0.0.1:3000",
          "x-forwarded-port": "3000",
          "x-forwarded-proto": "http",
        },
      }),
    ),
    "next_loopback_runtime_headers_cross_checked_and_accepted",
  );
  await expectRouteError(
    await input.handlers.POST(
      localPostRequest({
        body: { action: "bootstrap", bootstrap_token: "invalid" },
        omitOrigin: true,
      }),
    ),
    403,
    "same_origin_required",
    "missing_origin_rejected",
  );
  await expectRouteError(
    await input.handlers.POST(
      localPostRequest({
        body: { action: "bootstrap", bootstrap_token: "invalid" },
        origin: "http://localhost:3000",
      }),
    ),
    403,
    "same_origin_required",
    "wrong_origin_rejected",
  );
  for (const header of [
    "forwarded",
    "x-forwarded-host",
    "x-forwarded-proto",
  ]) {
    await expectRouteError(
      await input.handlers.GET(
        localGetRequest({ extraHeaders: { [header]: "localhost" } }),
      ),
      403,
      "forwarded_header_forbidden",
      `${header.replaceAll("-", "_")}_rejected`,
    );
  }
  await expectRouteError(
    await input.handlers.GET(
      new Request("https://localhost:3000/api/vnext/operator/session", {
        headers: {
          host: "127.0.0.1:3000",
          "x-forwarded-for": "127.0.0.1",
          "x-forwarded-host": "evil.example",
          "x-forwarded-port": "3000",
          "x-forwarded-proto": "https",
        },
      }),
    ),
    403,
    "forwarded_header_forbidden",
    "next_runtime_forwarded_spoof_rejected",
  );
  await expectRouteError(
    await input.handlers.GET(
      new Request("http://localhost:3000/api/vnext/operator/session", {
        headers: {
          host: "127.0.0.1:3000",
          "x-forwarded-for": "203.0.113.8",
          "x-forwarded-host": "127.0.0.1:3000",
          "x-forwarded-port": "3000",
          "x-forwarded-proto": "http",
        },
      }),
    ),
    403,
    "forwarded_header_forbidden",
    "next_runtime_non_loopback_source_rejected",
  );
  await expectRouteError(
    await input.handlers.POST(
      new Request(
        "http://127.0.0.1:3000/api/vnext/operator/session?bootstrap_token=forbidden",
        {
          method: "POST",
          headers: localPostHeaders(),
          body: JSON.stringify({
            action: "bootstrap",
            bootstrap_token: "invalid",
          }),
        },
      ),
    ),
    400,
    "operator_pilot_request_invalid",
    "query_string_bootstrap_token_rejected",
  );
}

async function assertCookieAndBootstrapRefusals(input: {
  handlers: ReturnType<typeof createVNextLocalOperatorSessionHandlersV01>;
}): Promise<void> {
  await expectRouteError(
    await input.handlers.GET(localGetRequest()),
    401,
    "operator_session_cookie_missing",
    "absent_session_rejected",
  );
  await expectRouteError(
    await input.handlers.GET(localGetRequest({ cookie: "malformed=value" })),
    401,
    "operator_session_cookie_invalid",
    "malformed_cookie_rejected",
  );
  await expectRouteError(
    await input.handlers.GET(
      localGetRequest({
        cookie:
          "augnes_vnext_operator_session_v01=vnext_session_v01.vnext-local-operator-session:missing-nonce.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      }),
    ),
    401,
    "operator_session_cookie_invalid",
    "cookie_missing_action_nonce_rejected",
  );
  await expectRouteError(
    await input.handlers.POST(localPostRequest({ body: { action: "logout" } })),
    401,
    "operator_session_cookie_missing",
    "action_nonce_required",
  );
  await expectRouteError(
    await input.handlers.POST(
      localPostRequest({
        body: { action: "bootstrap", bootstrap_token: "invalid", extra: true },
      }),
    ),
    400,
    "operator_pilot_body_invalid",
    "unknown_body_field_rejected",
  );
  await expectRouteError(
    await input.handlers.POST(
      new Request("http://127.0.0.1:3000/api/vnext/operator/session", {
        method: "POST",
        headers: localPostHeaders({ "content-type": "text/plain" }),
        body: "invalid",
      }),
    ),
    415,
    "operator_pilot_content_type_unsupported",
    "unsupported_content_type_rejected",
  );
  await expectRouteError(
    await input.handlers.POST(
      new Request("http://127.0.0.1:3000/api/vnext/operator/session", {
        method: "POST",
        headers: localPostHeaders(),
        body: "{",
      }),
    ),
    400,
    "operator_pilot_body_invalid",
    "malformed_json_rejected",
  );
  await expectRouteError(
    await input.handlers.POST(
      new Request("http://127.0.0.1:3000/api/vnext/operator/session", {
        method: "POST",
        headers: localPostHeaders({
          "content-length": String(
            VNEXT_LOCAL_OPERATOR_MAX_BODY_BYTES_V01 + 1,
          ),
        }),
        body: "{}",
      }),
    ),
    413,
    "operator_pilot_body_too_large",
    "oversized_content_length_rejected",
  );
  await expectRouteError(
    await input.handlers.POST(
      new Request("http://127.0.0.1:3000/api/vnext/operator/session", {
        method: "POST",
        headers: localPostHeaders(),
        body: "x".repeat(VNEXT_LOCAL_OPERATOR_MAX_BODY_BYTES_V01 + 1),
      }),
    ),
    413,
    "operator_pilot_body_too_large",
    "oversized_chunked_body_rejected",
  );
}

async function assertForeignScopeRefusal(input: {
  environment: NodeJS.ProcessEnv;
  clock: ManualClock;
  secretSource: DeterministicSecretSource;
  cookiePair: string;
}): Promise<void> {
  const foreignHandlers = createVNextLocalOperatorSessionHandlersV01({
    environment: {
      ...input.environment,
      AUGNES_VNEXT_OPERATOR_PROJECT_ID: "project:foreign",
    },
    clock: input.clock,
    secret_source: input.secretSource,
  });
  await expectRouteError(
    await foreignHandlers.GET(localGetRequest({ cookie: input.cookiePair })),
    403,
    "operator_session_scope_mismatch",
    "foreign_project_session_rejected",
  );
}

function issueBootstrap(
  environment: NodeJS.ProcessEnv,
  clock: VNextLocalRuntimeClockV01,
  secretSource: VNextLocalOperatorSecretSourceV01,
) {
  const config = readVNextLocalOperatorPilotConfigV01(environment);
  const db = openVNextLocalOperatorDatabaseV01(config);
  try {
    const result = issueVNextLocalOperatorBootstrapV01(db, {
      config,
      clock,
      secret_source: secretSource,
    });
    const serialized = JSON.stringify(
      db.prepare(
        "SELECT * FROM vnext_local_operator_sessions WHERE session_id = ?",
      ).get(result.session.session_id),
    );
    assert(!serialized.includes(result.bootstrap_token));
    assert.match(serialized, /sha256:[a-f0-9]{64}/);
    pass("bootstrap_token_hash_only_persisted");
    return result;
  } finally {
    db.close();
  }
}

async function bootstrapThroughRoute(
  handlers: {
    POST: OperatorPilotRouteHandlerV01;
  },
  bootstrapToken: string,
) {
  const response = await handlers.POST(
    new Request("http://127.0.0.1:3000/api/vnext/operator/session", {
      method: "POST",
      headers: localPostHeaders({
        "content-type": "application/x-www-form-urlencoded",
      }),
      body: new URLSearchParams({
        action: "bootstrap",
        bootstrap_token: bootstrapToken,
      }).toString(),
    }),
  );
  assertRouteSecurityHeaders(response);
  const setCookie = response.headers.get("set-cookie") ?? "";
  const cookiePair = setCookie.split(";", 1)[0];
  const body = await response.clone().json();
  return { response, setCookie, cookiePair, body };
}

function rotateNonce(
  environment: NodeJS.ProcessEnv,
  clock: VNextLocalRuntimeClockV01,
  secretSource: VNextLocalOperatorSecretSourceV01,
  cookiePair: string,
) {
  const config = readVNextLocalOperatorPilotConfigV01(environment);
  const credential = readVNextLocalOperatorCredentialFromRequestV01(
    localGetRequest({ cookie: cookiePair }),
  );
  const db = openVNextLocalOperatorDatabaseV01(config);
  try {
    const admission = admitVNextLocalOperatorMutationV01(db, {
      config,
      credential,
      clock,
      secret_source: secretSource,
    });
    return {
      cookiePair: `augnes_vnext_operator_session_v01=${admission.cookie_value}`,
    };
  } finally {
    db.close();
  }
}

function pilotEnvironment(input: {
  workspaceId: string;
  projectId: string;
  operatorId: string;
  databasePath: string;
}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "test",
    AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1",
    AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: input.workspaceId,
    AUGNES_VNEXT_OPERATOR_PROJECT_ID: input.projectId,
    AUGNES_VNEXT_OPERATOR_ID: input.operatorId,
    AUGNES_DB_PATH: input.databasePath,
  };
}

function localGetRequest(input: {
  cookie?: string;
  extraHeaders?: Record<string, string>;
} = {}): Request {
  const headers = new Headers({ host: "127.0.0.1:3000" });
  if (input.cookie) headers.set("cookie", input.cookie);
  for (const [key, value] of Object.entries(input.extraHeaders ?? {})) {
    headers.set(key, value);
  }
  return new Request(
    "http://127.0.0.1:3000/api/vnext/operator/session",
    { headers },
  );
}

class RouteCookieJar {
  private readonly values = new Map<string, string>();

  setPair(pair: string): void {
    const separator = pair.indexOf("=");
    assert(separator > 0, "cookie pair must include a name and value");
    const name = pair.slice(0, separator);
    const value = pair.slice(separator + 1);
    this.values.set(name, value);
    rememberCredentialMaterial(value);
  }

  absorb(response: Response): void {
    const headers = response.headers as Headers & {
      getSetCookie?: () => string[];
    };
    const cookies = headers.getSetCookie?.() ?? [];
    for (const cookie of cookies) {
      const pair = cookie.split(";", 1)[0]!;
      const separator = pair.indexOf("=");
      if (separator <= 0) continue;
      const name = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      if (/Max-Age=0(?:;|$)/i.test(cookie) || value === "") {
        this.values.delete(name);
      } else {
        this.values.set(name, value);
        rememberCredentialMaterial(value);
      }
    }
  }

  header(): string {
    return [...this.values]
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }
}

function routeRequest(
  routePath: string,
  input: {
    method: "GET" | "POST";
    jar?: RouteCookieJar;
    query?: Record<string, string>;
    body?: Record<string, unknown>;
    origin?: string;
  },
): Request {
  const url = new URL(`http://127.0.0.1:3000${routePath}`);
  for (const [key, value] of Object.entries(input.query ?? {})) {
    url.searchParams.set(key, value);
  }
  const headers = new Headers({ host: "127.0.0.1:3000" });
  const cookie = input.jar?.header();
  if (cookie) headers.set("cookie", cookie);
  if (input.method === "POST") {
    headers.set("origin", input.origin ?? "http://127.0.0.1:3000");
    headers.set("sec-fetch-site", "same-origin");
    headers.set("content-type", "application/json");
  }
  return new Request(url, {
    method: input.method,
    headers,
    ...(input.body ? { body: JSON.stringify(input.body) } : {}),
  });
}

async function publicJson(response: Response): Promise<Record<string, unknown>> {
  assertRouteSecurityHeaders(response);
  const body = (await response.clone().json()) as Record<string, unknown>;
  assertPublicResponseHasNoCredentials(body);
  return body;
}

function localPostRequest(input: {
  body: Record<string, unknown>;
  cookie?: string;
  origin?: string;
  omitOrigin?: boolean;
}): Request {
  const headers = localPostHeaders();
  if (input.omitOrigin) headers.delete("origin");
  if (input.origin) headers.set("origin", input.origin);
  if (input.cookie) headers.set("cookie", input.cookie);
  return new Request(
    "http://127.0.0.1:3000/api/vnext/operator/session",
    {
      method: "POST",
      headers,
      body: JSON.stringify(input.body),
    },
  );
}

function localPostHeaders(
  overrides: Record<string, string> = {},
): Headers {
  return new Headers({
    host: "127.0.0.1:3000",
    origin: "http://127.0.0.1:3000",
    "sec-fetch-site": "same-origin",
    "content-type": "application/json",
    ...overrides,
  });
}

async function expectRouteError(
  response: Response,
  status: number,
  code: string,
  caseId: string,
): Promise<void> {
  assert.equal(response.status, status, caseId);
  assertRouteSecurityHeaders(response);
  const body = await response.json();
  assert.equal(body.ok, false, caseId);
  assert.equal(body.error_code, code, caseId);
  assert.equal(body.semantic_authority_granted, false, caseId);
  assertPublicResponseHasNoCredentials(body);
  reject(caseId);
}

async function expectTransportAcceptedThroughAuthenticationBoundary(
  response: Response,
  caseId: string,
): Promise<void> {
  assert.equal(response.status, 401, caseId);
  assertRouteSecurityHeaders(response);
  const body = await response.json();
  assert.equal(body.error_code, "operator_session_cookie_missing", caseId);
  pass(caseId);
}

function assertRouteSecurityHeaders(response: Response): void {
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(
    response.headers.get("content-security-policy"),
    "frame-ancestors 'none'",
  );
  assert.equal(response.headers.has("access-control-allow-origin"), false);
}

function assertCookieFlags(setCookie: string): void {
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Strict/);
  assert.match(setCookie, /Path=\/api\/vnext\/operator(?:;|$)/);
  assert.match(setCookie, /Max-Age=\d+/);
  assert.match(setCookie, /Expires=/);
  assert.doesNotMatch(setCookie, /Domain=/i);
}

function assertPublicResponseHasNoCredentials(
  body: unknown,
  ...specificCredentials: string[]
): void {
  const serialized = JSON.stringify(body);
  assert.doesNotMatch(serialized, /bootstrap_token_hash|session_token_hash|action_nonce_hash/);
  for (const credential of specificCredentials) {
    assert(!serialized.includes(credential));
  }
  for (const credential of credentialMaterial) {
    assert(!serialized.includes(credential));
  }
}

function rememberCredentialMaterial(value: string): void {
  credentialMaterial.add(value);
  const segments = value.split(".");
  for (const segment of segments.slice(2)) {
    if (segment.length >= 40) credentialMaterial.add(segment);
  }
}

function rememberCookie(cookiePair: string): void {
  const value = cookiePair.slice(cookiePair.indexOf("=") + 1);
  rememberCredentialMaterial(value);
}

function snapshotNonSessionRows(
  databasePath: string,
): Record<string, { count: number; row_hash: string }> {
  const db = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    const tables = (
      db.prepare(
        `SELECT name FROM sqlite_master
         WHERE type = 'table'
           AND name NOT LIKE 'sqlite_%'
           AND name <> 'vnext_local_operator_sessions'
         ORDER BY name`,
      ).all() as { name: string }[]
    ).map((row) => row.name);
    return Object.fromEntries(tables.map((table) => {
      const rows = db
        .prepare(`SELECT * FROM ${quoteIdentifier(table)}`)
        .all()
        .map((row) => canonicalJson(row))
        .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
      return [
        table,
        {
          count: rows.length,
          row_hash: `sha256:${createHash("sha256")
            .update(JSON.stringify(rows))
            .digest("hex")}`,
        },
      ];
    }));
  } finally {
    db.close();
  }
}

function assertNoPlaintextCredentialPersistence(databasePath: string): void {
  const db = new Database(databasePath, { readonly: true, fileMustExist: true });
  let serializedRows = "";
  try {
    serializedRows = JSON.stringify(
      db.prepare("SELECT * FROM vnext_local_operator_sessions").all(),
    );
  } finally {
    db.close();
  }
  const databaseArtifacts = [
    databasePath,
    `${databasePath}-wal`,
    `${databasePath}-shm`,
    `${databasePath}-journal`,
  ].filter(existsSync);
  for (const credential of credentialMaterial) {
    assert(!serializedRows.includes(credential));
    const bytes = Buffer.from(credential, "utf8");
    for (const artifact of databaseArtifacts) {
      assert.equal(readFileSync(artifact).includes(bytes), false);
    }
  }
}

function countRows(databasePath: string, table: string): number {
  const db = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    return Number(
      (db.prepare(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(table)}`).get() as {
        count: number;
      }).count,
    );
  } finally {
    db.close();
  }
}

function coreRecordCount(databasePath: string): number {
  return countRows(databasePath, "vnext_core_records");
}

function countProjectRows(
  databasePath: string,
  table: string,
  workspaceId: string,
  projectId: string,
): number {
  const db = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    return Number(
      (
        db
          .prepare(
            `SELECT COUNT(*) AS count FROM ${quoteIdentifier(table)}
             WHERE workspace_id = ? AND project_id = ?`,
          )
          .get(workspaceId, projectId) as { count: number }
      ).count,
    );
  } finally {
    db.close();
  }
}

function snapshotLegacyRows(
  databasePath: string,
): Record<string, { count: number; row_hash: string }> {
  return Object.fromEntries(
    Object.entries(snapshotNonSessionRows(databasePath)).filter(
      ([table]) =>
        !table.startsWith("vnext_") && !table.startsWith("autonomy_run"),
    ),
  );
}

function assertBackupRestore(
  databasePath: string,
  anchors: Record<string, string>,
): void {
  const backupPath = path.join(tempRoot, "operator-pilot-backup.db");
  const restoredPath = path.join(tempRoot, "operator-pilot-restored.db");
  const checkpoint = new Database(databasePath, { fileMustExist: true });
  try {
    checkpoint.pragma("wal_checkpoint(TRUNCATE)");
    assert.deepEqual(checkpoint.pragma("integrity_check"), [
      { integrity_check: "ok" },
    ]);
  } finally {
    checkpoint.close();
  }

  const before = snapshotDurableRows(databasePath);
  copyFileSync(databasePath, backupPath);
  copyFileSync(backupPath, restoredPath);
  const restored = snapshotDurableRows(restoredPath);
  assert.deepEqual(
    restored,
    before,
    "backup/restore must preserve exact durable rows, identities, and schema",
  );

  const restoredDb = new Database(restoredPath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    assert.deepEqual(restoredDb.pragma("integrity_check"), [
      { integrity_check: "ok" },
    ]);
    const identities = restoredDb
      .prepare(
        `SELECT record_kind, record_id, fingerprint
         FROM vnext_core_records
         ORDER BY record_kind, record_id`,
      )
      .all() as Array<{
        record_kind: string;
        record_id: string;
        fingerprint: string;
      }>;
    for (const [recordKind, recordId, fingerprint] of [
      [
        "review_decision",
        anchors.review_decision_id,
        anchors.review_decision_fingerprint,
      ],
      [
        "semantic_commit_gate",
        anchors.gate_id,
        anchors.gate_fingerprint,
      ],
      [
        "state_transition_receipt",
        anchors.transition_receipt_id,
        anchors.transition_receipt_fingerprint,
      ],
      [
        "task_context_packet",
        anchors.later_packet_id,
        anchors.later_packet_fingerprint,
      ],
      [
        "run_receipt",
        anchors.later_run_receipt_id,
        anchors.later_run_receipt_fingerprint,
      ],
      [
        "context_use_review",
        anchors.context_use_review_id,
        anchors.context_use_review_fingerprint,
      ],
    ] as const) {
      assert(
        identities.some(
          (identity) =>
            identity.record_kind === recordKind &&
            identity.record_id === recordId &&
            identity.fingerprint === fingerprint,
        ),
        `restored durable identity missing: ${recordKind}/${recordId}`,
      );
    }
  } finally {
    restoredDb.close();
  }
  pass("backup_restore_preserves_exact_records_identities_and_integrity");
}

function snapshotDurableRows(databasePath: string): {
  rows: Record<string, { count: number; row_hash: string }>;
  schema_hash: string;
} {
  const db = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    const tables = [
      "vnext_core_records",
      "vnext_semantic_state_entries",
      "vnext_semantic_target_heads",
      "vnext_local_operator_sessions",
    ];
    const rows = Object.fromEntries(
      tables.map((table) => {
        const values = db
          .prepare(`SELECT * FROM ${quoteIdentifier(table)}`)
          .all()
          .map((row) => canonicalJson(row))
          .sort((left, right) =>
            JSON.stringify(left).localeCompare(JSON.stringify(right)),
          );
        return [
          table,
          {
            count: values.length,
            row_hash: `sha256:${createHash("sha256")
              .update(JSON.stringify(values))
              .digest("hex")}`,
          },
        ];
      }),
    );
    const schema = (
      db
        .prepare(
          `SELECT type, name, tbl_name, sql
           FROM sqlite_master
           WHERE name LIKE 'vnext_%' OR tbl_name LIKE 'vnext_%'
           ORDER BY type, name`,
        )
        .all() as Array<Record<string, unknown>>
    ).map((row) => canonicalJson(row));
    return {
      rows,
      schema_hash: `sha256:${createHash("sha256")
        .update(JSON.stringify(schema))
        .digest("hex")}`,
    };
  } finally {
    db.close();
  }
}

function validatePopulatedOldRecordKindMigration(): void {
  const db = new Database(recordKindMigrationDbPath);
  const fingerprint = `sha256:${"1".repeat(64)}`;
  try {
    db.exec(`
      CREATE TABLE vnext_core_records (
        record_kind TEXT NOT NULL CHECK (record_kind IN (
          'episode_delta_proposal', 'review_decision',
          'semantic_commit_gate', 'semantic_state',
          'state_transition_receipt', 'task_context_packet', 'run_receipt'
        )),
        record_id TEXT NOT NULL,
        workspace_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        fingerprint TEXT NOT NULL,
        idempotency_key TEXT,
        payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
        created_at TEXT NOT NULL,
        PRIMARY KEY (record_kind, record_id)
      );
      CREATE TRIGGER trg_vnext_core_records_immutable_update
        BEFORE UPDATE ON vnext_core_records
        BEGIN SELECT RAISE(ABORT, 'vnext_core_records_immutable'); END;
      CREATE TRIGGER trg_vnext_core_records_immutable_delete
        BEFORE DELETE ON vnext_core_records
        BEGIN SELECT RAISE(ABORT, 'vnext_core_records_immutable'); END;
    `);
    db.prepare(
      `INSERT INTO vnext_core_records (
        record_kind, record_id, workspace_id, project_id, fingerprint,
        idempotency_key, payload_json, created_at
      ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`,
    ).run(
      "run_receipt",
      "run-receipt:old-check-populated",
      "workspace:migration",
      "project:migration",
      fingerprint,
      JSON.stringify({ preserved: true }),
      "2026-07-11T00:00:00.000Z",
    );
    const first = migrateVNextDurableSemanticStoreV01(db);
    assert.deepEqual(first.rebuilt_tables, ["vnext_core_records"]);
    assert.deepEqual(
      db.prepare(
        `SELECT record_kind, record_id, fingerprint, payload_json
         FROM vnext_core_records`,
      ).all(),
      [
        {
          record_kind: "run_receipt",
          record_id: "run-receipt:old-check-populated",
          fingerprint,
          payload_json: JSON.stringify({ preserved: true }),
        },
      ],
    );
    assert.throws(
      () =>
        db.prepare(
          `UPDATE vnext_core_records SET created_at = created_at
           WHERE record_id = 'run-receipt:old-check-populated'`,
        ).run(),
      /vnext_core_records_immutable/,
    );
    const second = migrateVNextDurableSemanticStoreV01(db);
    assert.deepEqual(second.rebuilt_tables, []);
    assert.deepEqual(db.pragma("integrity_check"), [{ integrity_check: "ok" }]);
    pass("populated_old_record_kind_check_upgraded_permanently");
    pass("record_kind_upgrade_repeat_is_noop");
    pass("record_kind_upgrade_preserves_immutable_triggers_and_rows");
  } finally {
    db.close();
  }
}

function assertStaticBrowserSafetyMarkers(): void {
  const directory = path.join(
    process.cwd(),
    "components",
    "workbench",
    "semantic-review",
  );
  const session = readFileSync(
    path.join(directory, "operator-session-panel.tsx"),
    "utf8",
  );
  const transition = readFileSync(
    path.join(directory, "semantic-transition-actions.tsx"),
    "utf8",
  );
  const proposalDetail = readFileSync(
    path.join(directory, "proposal-detail.tsx"),
    "utf8",
  );
  const durableLineage = readFileSync(
    path.join(directory, "durable-lineage-panel.tsx"),
    "utf8",
  );
  const laterResult = readFileSync(
    path.join(directory, "later-result-intake-panel.tsx"),
    "utf8",
  );
  const contextReview = readFileSync(
    path.join(directory, "context-use-review-panel.tsx"),
    "utf8",
  );
  const packetPage = readFileSync(
    path.join(
      process.cwd(),
      "app",
      "workbench",
      "semantic-review",
      "packet-handoff",
      "[packet_id]",
      "page.tsx",
    ),
    "utf8",
  );
  const continuityCard = readFileSync(
    path.join(
      process.cwd(),
      "components",
      "human-surface",
      "vnext-project-continuity-card.tsx",
    ),
    "utf8",
  );
  for (const marker of [
    "event.preventDefault();",
    'setBootstrapToken("");',
    'type="password"',
    'autoComplete="off"',
  ]) assert(session.includes(marker));
  assert(laterResult.includes('data-vnext-later-result-native-post="false"'));
  assert(
    contextReview.includes(
      'data-vnext-context-use-review-native-post="false"',
    ),
  );
  for (const action of ["preview", "confirm", "commit", "compile"]) {
    assert.match(
      transition,
      new RegExp(
        `type="button"[\\s\\S]{0,160}data-vnext-transition-action="${action}"`,
      ),
    );
  }
  assert(proposalDetail.includes("classification.pilot_actionable"));
  assert(
    proposalDetail.includes("generic history · not pilot actionable"),
  );
  for (const marker of [
    'data-vnext-durable-lineage="v0.1"',
    "Packet not compiled",
    "Later result not recorded",
    "Context use not reviewed",
    "Helpfulness established",
  ]) {
    assert(durableLineage.includes(marker));
  }
  for (const forbidden of ["fetch(", "method: \"POST\"", "<button", "<form"]) {
    assert.equal(durableLineage.includes(forbidden), false);
  }
  pass("workbench_durable_lineage_panel_is_read_only_and_explicit");
  pass("api_and_ui_share_session_bound_decision_actionability_policy");
  assert(
    packetPage.includes("decodeTaskContextPacketHandoffSlugV01(packetSlug)"),
  );
  assert(
    continuityCard.includes("buildTaskContextPacketHandoffHrefV01(packet)"),
  );
  assert.equal(
    packetPage.includes("task-context-packet~[a-f0-9]{24}"),
    false,
  );
  assert.equal(
    continuityCard.includes("task-context-packet:[a-f0-9]{24}"),
    false,
  );
  pass("page_and_project_home_share_canonical_packet_handoff_identity");
  const combined = [
    session,
    transition,
    proposalDetail,
    durableLineage,
    laterResult,
    contextReview,
  ].join("\n");
  for (const forbidden of [
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "document.cookie",
    "bootstrap_token_hash",
    "session_token_hash",
    "action_nonce_hash",
  ]) assert.equal(combined.includes(forbidden), false);
  pass("static_refresh_resubmit_and_credential_safety_markers_present");
}

async function exportOperatorPilotBrowserFixtureV01(input: {
  anchors: Record<string, string>;
  proposal: { proposal_id: string; proposal_fingerprint: string };
  handoffHref: string;
}): Promise<
  | { exported: false }
  | {
      exported: true;
      manifest_path: string;
      database_mode: "copied_fixture";
    }
> {
  const requestedDirectory =
    process.env.AUGNES_VNEXT_OPERATOR_PILOT_BROWSER_FIXTURE_DIR?.trim();
  if (!requestedDirectory) return { exported: false };

  const manifest = {
    fixture_version: "vnext_operator_pilot_browser_fixture.v0.1",
    workspace_id: OPERATOR_WORKSPACE_ID,
    project_id: OPERATOR_PROJECT_ID,
    operator_id: "operator:operator-pilot-smoke",
    proposal_id: input.proposal.proposal_id,
    proposal_fingerprint: input.proposal.proposal_fingerprint,
    packet_id: input.anchors.later_packet_id,
    packet_fingerprint: input.anchors.later_packet_fingerprint,
    transition_receipt_id: input.anchors.transition_receipt_id,
    transition_receipt_fingerprint:
      input.anchors.transition_receipt_fingerprint,
    later_result_receipt_id: input.anchors.later_run_receipt_id,
    later_result_receipt_fingerprint:
      input.anchors.later_run_receipt_fingerprint,
    context_use_review_id: input.anchors.context_use_review_id,
    context_use_review_fingerprint:
      input.anchors.context_use_review_fingerprint,
    handoff_href: input.handoffHref,
    credential_material_included: false,
    external_identity_authenticated: false,
    semantic_authority_granted: false,
  };

  assert.equal(path.isAbsolute(requestedDirectory), true);
  const directory = path.resolve(requestedDirectory);
  const relativeToOsTemp = path.relative(path.resolve(tmpdir()), directory);
  assert(
    relativeToOsTemp.length > 0 &&
      !relativeToOsTemp.startsWith(`..${path.sep}`) &&
      relativeToOsTemp !== ".." &&
      !path.isAbsolute(relativeToOsTemp),
    "browser fixture export must stay inside the OS temporary directory",
  );
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const databasePath = path.join(directory, "operator-pilot.db");
  const manifestPath = path.join(directory, "operator-pilot-browser-fixture.json");
  assert.equal(existsSync(databasePath), false);
  assert.equal(existsSync(manifestPath), false);
  const source = new Database(canonicalDbPath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    await source.backup(databasePath);
  } finally {
    source.close();
  }
  const exportedRoot = path.join(directory, "operator-project-root");
  mkdirSync(exportedRoot, { recursive: true, mode: 0o700 });
  const exported = new Database(databasePath, { fileMustExist: true });
  try {
    exported.pragma("foreign_keys = ON");
    rebindCanonicalProjectLocalRootV01(
      exported,
      {
        workspace_id: OPERATOR_WORKSPACE_ID,
        project_id: OPERATOR_PROJECT_ID,
        local_root: normalizeLocalProjectRootRefV01(exportedRoot, {
          base_path: path.parse(exportedRoot).root,
        }),
      },
      { now: () => "2026-07-11T09:26:00.000Z" },
    );
    exported
      .prepare("DELETE FROM vnext_active_project_selections WHERE workspace_id = ?")
      .run(OPERATOR_WORKSPACE_ID);
    exported
      .prepare("DELETE FROM vnext_recent_projects WHERE workspace_id = ?")
      .run(OPERATOR_WORKSPACE_ID);
  } finally {
    exported.close();
  }
  chmodSync(databasePath, 0o600);
  writeFileSync(
    manifestPath,
    `${JSON.stringify(
      {
        ...manifest,
        database_file: path.basename(databasePath),
        database_binding: "copied_fixture",
        database_identity: databaseFileIdentityV01(databasePath),
      },
      null,
      2,
    )}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
  return {
    exported: true,
    manifest_path: manifestPath,
    database_mode: "copied_fixture",
  };
}

function databaseFileIdentityV01(databasePath: string): {
  canonical_path_sha256: string;
  device: string;
  inode: string;
} {
  const canonicalPath = realpathSync(databasePath);
  const entry = statSync(canonicalPath);
  assert.equal(entry.isFile(), true);
  return {
    canonical_path_sha256: `sha256:${createHash("sha256")
      .update(canonicalPath)
      .digest("hex")}`,
    device: String(entry.dev),
    inode: String(entry.ino),
  };
}

function assertIntegrity(databasePath: string): void {
  const db = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    const rows = db.pragma("integrity_check") as { integrity_check: string }[];
    assert.deepEqual(rows, [{ integrity_check: "ok" }]);
  } finally {
    db.close();
  }
}

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function canonicalJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (Buffer.isBuffer(value)) return { type: "Buffer", data: [...value] };
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalJson(nested)]),
    );
  }
  if (typeof value === "bigint") return value.toString();
  return value;
}

function installZeroNetworkGuard() {
  const attempts: string[] = [];
  const restores: Array<() => void> = [];
  const modules = {
    http: require("node:http"),
    https: require("node:https"),
    net: require("node:net"),
    tls: require("node:tls"),
    dns: require("node:dns"),
  } as Record<string, Record<string, unknown>>;
  patch(globalThis as unknown as Record<string, unknown>, "fetch", "fetch");
  for (const [moduleName, methods] of Object.entries({
    http: ["request", "get"],
    https: ["request", "get"],
    net: ["connect", "createConnection"],
    tls: ["connect"],
    dns: ["lookup", "resolve", "resolve4", "resolve6", "resolveAny", "reverse"],
  })) {
    for (const method of methods) {
      patch(modules[moduleName], method, `${moduleName}.${method}`);
    }
  }
  const dnsPromises = modules.dns.promises as Record<string, unknown> | undefined;
  if (dnsPromises) {
    for (const method of ["lookup", "resolve", "resolve4", "resolve6", "resolveAny", "reverse"]) {
      patch(dnsPromises, method, `dns.promises.${method}`);
    }
  }
  return {
    attempts,
    restore() {
      restores.reverse().forEach((restore) => restore());
    },
  };

  function patch(
    target: Record<string, unknown>,
    method: string,
    label: string,
  ): void {
    const original = target[method];
    if (typeof original !== "function") return;
    target[method] = (...args: unknown[]) => {
      if (isExactLoopbackCall(label, args)) {
        return Reflect.apply(original, target, args);
      }
      attempts.push(label);
      throw new Error(`operator_pilot_external_io_blocked:${label}`);
    };
    restores.push(() => {
      target[method] = original;
    });
  }

  function isExactLoopbackCall(label: string, args: unknown[]): boolean {
    if (label.startsWith("dns.")) {
      return isLoopbackHost(args[0]);
    }
    if (label.startsWith("http.")) {
      const first = args[0];
      if (first instanceof URL) return isLoopbackHost(first.hostname);
      if (typeof first === "string") {
        try {
          return isLoopbackHost(new URL(first).hostname);
        } catch {
          return false;
        }
      }
      if (first && typeof first === "object") {
        return isLoopbackHost(
          (first as { hostname?: unknown; host?: unknown }).hostname ??
            (first as { host?: unknown }).host,
        );
      }
      return false;
    }
    if (label.startsWith("net.")) {
      const first = args[0];
      if (first && typeof first === "object") {
        return isLoopbackHost((first as { host?: unknown }).host);
      }
      return isLoopbackHost(args[1]);
    }
    return false;
  }

  function isLoopbackHost(value: unknown): boolean {
    return (
      value === "127.0.0.1" ||
      value === "::1" ||
      value === "[::1]" ||
      value === "localhost"
    );
  }
}

function pass(caseId: string): void {
  if (!positiveCases.includes(caseId)) positiveCases.push(caseId);
}

function reject(caseId: string): void {
  if (!negativeCases.includes(caseId)) negativeCases.push(caseId);
}
