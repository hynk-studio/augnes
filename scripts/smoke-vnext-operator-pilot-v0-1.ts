#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer, request as requestHttp } from "node:http";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import {
  readAutonomyRunLedgerRecord,
  updateAutonomyRunLedgerFields,
} from "../lib/autonomy/runner-ledger";
import {
  createVNextOperatorHostRoundTripHandlerV01,
  createVNextOperatorHostRoundTripReadHandlerV01,
} from "../app/api/vnext/operator/host-round-trip/route";
import { createVNextOperatorRunResultReadHandlerV01 } from "../app/api/vnext/operator/run-results/route";
import {
  createVNextOperatorContextUseReviewHandlerV01,
  createVNextOperatorProjectContinuityHandlerV01,
} from "../app/api/vnext/operator/project-continuity/route";
import { createVNextOperatorSemanticReviewHandlersV01 } from "../app/api/vnext/operator/semantic-review/route";
import { createVNextOperatorSemanticTransitionHandlersV01 } from "../app/api/vnext/operator/semantic-transition/route";
import { createVNextLocalOperatorSessionHandlersV01 } from "../app/api/vnext/operator/session/route";
import {
  buildSemanticReviewLoopTaskContextPacketFixture,
  buildSemanticReviewLoopProposalFixture,
  buildSemanticReviewLoopRunReceiptFixture,
  type SemanticReviewLoopProjectFixtureV01,
} from "../fixtures/vnext/protocol/semantic-review-loop-v0-1";
import {
  createEpisodeDeltaProposalFingerprintV01,
  deriveEpisodeDeltaProposalIdV01,
} from "../lib/vnext/episode-delta-proposal";
import {
  createContextUseReviewFingerprintV01,
  deriveContextUseReviewIdV01,
} from "../lib/vnext/context-use-review";
import {
  buildReviewDecisionV01,
  createEpisodeDeltaCandidateFingerprintV01,
  validateReviewDecisionAgainstEpisodeDeltaProposalV01,
  validateReviewDecisionV01,
} from "../lib/vnext/review-decision";
import {
  insertVNextCoreRecordV01,
  readVNextCoreRecordV01,
} from "../lib/vnext/persistence/durable-semantic-store";
import {
  getOrCreateCanonicalProjectForLocalRootV01,
  getOrCreateDefaultWorkspaceIdentityV01,
  normalizeLocalProjectRootRefV01,
  readCanonicalProjectWithRootV01,
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
  buildModelGatewayCostAuthorityV01,
  buildModelGatewayCostBudgetV01,
} from "../lib/vnext/model-gateway/cost-authority";
import {
  buildRunReceiptV01,
  createRunReceiptFingerprintV01,
  createRunReceiptIdempotencyKeyV01,
  deriveRunReceiptIdV01,
  validateRunReceiptV01,
} from "../lib/vnext/run-receipt";
import {
  buildTaskContextPacketV01,
  isTaskContextPacketIdV01,
  TASK_CONTEXT_PACKET_ID_HEX_LENGTH_V01,
} from "../lib/vnext/task-context-packet";
import { assertNativeHostResultV01 } from "../lib/vnext/native-host/native-host-contract";
import {
  createDeterministicCodexAdapterV01,
  type DeterministicCodexAdapterObservationV01,
} from "../lib/vnext/native-host/deterministic-codex-adapter";
import {
  createCodexAppServerAdapterV01,
  type CodexAppServerAdapterObservationV01,
} from "../lib/vnext/native-host/codex-app-server-adapter";
import { canonicalizeRepositoryRelativePathV01 } from "../lib/vnext/repository-relative-path";
import { materializeRunAssessmentProposalV01 } from "../lib/vnext/run-assessment-proposal";
import { materializeStrategicAdvantageTransferProposalV01 } from "../lib/vnext/strategic-advantage-transfer";
import { createStrategicAdvantageTransferAdverseContextV01 } from "../lib/vnext/strategic-advantage-transfer-protocol";
import { ModelGatewayInvocationErrorV01 } from "../lib/vnext/model-gateway/contracts";
import {
  createOpenAIResponsesAdapterV01,
  type OpenAIResponsesTransportRequestV01,
} from "../lib/vnext/model-gateway/openai/responses-adapter";
import type { ProjectRunResultDetailV01 } from "../types/vnext/project-run-result";
import { admitStructuredRunReceiptV01 } from "../lib/vnext/persistence/structured-run-receipt-admission";
import { admitEpisodeDeltaProposalV01 } from "../lib/vnext/persistence/episode-delta-proposal-admission";
import {
  DirectNativeHostRoundTripErrorV01,
  runDirectNativeHostRoundTripV01,
} from "../lib/vnext/runtime/direct-native-host-round-trip";
import {
  LiveNativeHostRunServiceV01,
  type LiveNativeHostRunProjectionV01,
} from "../lib/vnext/runtime/live-native-host-run-service";
import { projectVNextOperatorPilotContinuityV01 } from "../lib/vnext/runtime/operator-pilot-project-continuity";
import {
  ProjectRunResultReadErrorV01,
  readProjectRunResultDetailV01,
  readProjectRunResultOverviewV01,
  readProjectRunResultSourceBindingV01,
} from "../lib/vnext/runtime/project-run-result-read-model";
import { evaluateVNextOperatorPilotRevisionDeltaTargetCompatibilityV01 } from "../lib/vnext/runtime/operator-pilot-revision-compatibility";
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
import { deriveVNextOperatorPilotContextUseUsageProvenanceV01 } from "../lib/vnext/runtime/operator-pilot-context-use-review";
import {
  VNextOperatorPilotReviewErrorV01,
  createVNextOperatorPilotDecisionRequestFingerprintV01,
  createVNextOperatorPilotReviewDecisionSessionBasisRefV01,
  listVNextOperatorPilotSemanticReviewsV01,
  readVNextOperatorPilotSemanticReviewV01,
  recordVNextOperatorPilotReviewDecisionV01,
  validateVNextOperatorPilotReviewDecisionProvenanceV01,
  type VNextOperatorPilotDecisionRequestV01,
  type VNextOperatorPilotReviewDetailV01,
} from "../lib/vnext/runtime/operator-pilot-review-material";
import {
  applyVNextOperatorPilotReviewedSemanticTransitionV01,
  createVNextOperatorPilotSemanticConfirmationBasisRefV01,
  prepareVNextOperatorPilotSemanticCommitPreviewV01,
  validateVNextOperatorPilotSemanticGateConfirmationProvenanceV01,
} from "../lib/vnext/runtime/operator-pilot-semantic-transition";
import { readVNextOperatorPilotProposalDurableLineageV01 } from "../lib/vnext/runtime/operator-pilot-workbench-lineage";
import {
  readVNextOperatorStrategicAdvantageTransferV01,
  selectUniqueStrategicBaseV01,
} from "../lib/vnext/runtime/operator-pilot-strategic-advantage-transfer";
import { compileTaskContextPacketFromPersistedSemanticStateV01 } from "../lib/vnext/runtime/persisted-semantic-context-compiler";
import type { EpisodeDeltaProposalV01 } from "../types/vnext/episode-delta-proposal";
import type { ContextUseReviewV01 } from "../types/vnext/context-use-review";
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
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";

const SMOKE_VERSION = "vnext_operator_pilot_smoke.v0.1" as const;
const OPERATOR_WORKSPACE_UUID = "11111111-1111-4111-8111-111111111111";
const OPERATOR_PROJECT_UUID = "22222222-2222-4222-8222-222222222222";
const OPERATOR_WORKSPACE_ID = `workspace:${OPERATOR_WORKSPACE_UUID}`;
const OPERATOR_PROJECT_ID = `project:${OPERATOR_PROJECT_UUID}`;
const FOREIGN_PROJECT_ID = "project:33333333-3333-4333-8333-333333333333";
const EXPECTED_FULL_LOOP_ANCHORS = {
  review_decision_id: "review-decision:28a6f5f4ceb0ecd35c898653",
  review_decision_fingerprint:
    "sha256:86565d140fae8254c5817391f6e2b652e4a54c23d2c5bedff7437464ece29305",
  confirmation_digest:
    "sha256:2979cb42b906ade1ad05ae8df9d02c67e14a81432fa02f8917fa4610e766d6f5",
  gate_id: "semantic-commit-gate:2c7c91a5a64793c9b255c7c5",
  gate_fingerprint:
    "sha256:72643c1c5d10805794d35d3bcdfa62a1d27c0512a813a13e0e9795a6096ef2f4",
  transition_receipt_id: "state-transition-receipt:6821c1e7c985cbb689db2c54",
  transition_receipt_idempotency_key:
    "sha256:19e3719b4d92dcac46a48457427fe8d5a32a9ef00e1d5d6b82f7a4b6c029b5bb",
  transition_receipt_fingerprint:
    "sha256:4a9633851d40979eb3b741f60fb34b4670d0a56db12a17d0b703be1aa06c545f",
  later_packet_id: "task-context-packet:bd514b01ca59252530639c8",
  later_packet_fingerprint:
    "sha256:ff7c163e402bf4af6cb71871969843ba19fa4730cbbff92f13e3e155e4f801af",
  full_loop_fingerprint:
    "sha256:94b72a6fe25f27368b23efc599abf52e406a118be8f349d4a888bd733c003119",
} as const;
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
const crossSessionReplayDbPath = path.join(tempRoot, "cross-session-replay.db");
const schemaSql = readFileSync(
  path.join(process.cwd(), "lib", "db", "schema.sql"),
  "utf8",
);
const positiveCases: string[] = [];
const negativeCases: string[] = [];
const credentialMaterial = new Set<string>();
let networkGuard: ReturnType<typeof installZeroNetworkGuard> | null = null;
let finalSummary: Record<string, unknown> | null = null;
class ManualClock implements VNextLocalRuntimeClockV01 {
  private value: string;

  constructor(
    value: string,
    private readonly offset_ms = 0,
  ) {
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

interface StrategicAdvantageTransferSmokeGatewayV01 {
  adapter: ReturnType<typeof createOpenAIResponsesAdapterV01>;
  transport_calls(): number;
  requests(): readonly OpenAIResponsesTransportRequestV01[];
}

function createStrategicAdvantageTransferSmokeGatewayV01(
  mode: "success" | "transport_failure" | "unknown_source" = "success",
): StrategicAdvantageTransferSmokeGatewayV01 {
  let transportCalls = 0;
  const requests: OpenAIResponsesTransportRequestV01[] = [];
  const fixtureCredential = "operator-pilot-strategic-fixture-credential";
  rememberCredentialMaterial(fixtureCredential);
  const adapter = createOpenAIResponsesAdapterV01({
    environment: {
      OPENAI_API_KEY: fixtureCredential,
      OPENAI_MODEL: "operator-pilot-strategic-fixture-model",
    },
    transport: async (request) => {
      transportCalls += 1;
      requests.push(request);
      if (mode === "transport_failure") {
        throw new Error("injected bounded strategic transport failure");
      }
      const payload = JSON.parse(request.body) as {
        input: Array<{
          content: Array<{ text: string }>;
        }>;
      };
      const projected = JSON.parse(payload.input[1]!.content[0]!.text) as {
        source_catalog: {
          items: Array<{ source_key: string; material_kind: string }>;
        };
      };
      const base = projected.source_catalog.items.find(
        (entry) => entry.material_kind === "accepted_agent_plan_base",
      );
      assert(
        base,
        "strategic fake transport requires the exact accepted plan source key",
      );
      const transferSourceKey =
        mode === "unknown_source"
          ? "source:000000000000000000000000"
          : base.source_key;
      const output = {
        schema_version: "strategic_advantage_transfer_model_output.v0.1",
        lens_results: [
          {
            result: "transfer",
            lens_id: "constraint_fit",
            title:
              "Preserve the accepted plan while narrowing validation scope",
            applicability_condition:
              "The exact accepted plan remains current and selected in the source packet.",
            expected_effect:
              "Reviewers can validate one local plan constraint without treating execution completion as task success.",
            transfer_cost:
              "One bounded validation pass and one explicit human review are required.",
            source_keys: [transferSourceKey],
            falsifier:
              "The transfer is invalid if the accepted plan head or source packet selection changes.",
            uncertainty: [
              "The source criterion assessment remains unknown and insufficient.",
            ],
            introduced_risks: [
              "A narrow validation focus could omit unrelated plan regressions.",
            ],
            patch_summary:
              "Add a review-only validation candidate linked to the exact accepted plan base.",
            regression_review: {
              regression_risks: [
                "The plan may become stale before a reviewer authors an operation-aware revision.",
              ],
              checks_or_observations_needed: [
                "Re-read the accepted plan head and packet binding before any later revision.",
              ],
              stop_conditions: [
                "Stop when the base fingerprint no longer matches current accepted state.",
              ],
              invalidation_conditions: [
                "Invalidate when the accepted plan is replaced, superseded, or retracted.",
              ],
              source_keys: [transferSourceKey],
            },
            known_limitations: [
              "This derived transfer remains pending candidate material with operation unknown.",
            ],
          },
          {
            result: "no_transfer",
            lens_id: "verification_leverage",
            non_transfer_reason:
              "No additional exact source establishes a second local verification transfer.",
          },
          {
            result: "no_transfer",
            lens_id: "regression_safety",
            non_transfer_reason:
              "The bounded source catalog does not justify a separate regression transfer.",
          },
        ],
        stop_reason: "completed",
      };
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            status: "completed",
            output: [
              {
                type: "message",
                content: [
                  { type: "output_text", text: JSON.stringify(output) },
                ],
              },
            ],
            usage: {
              input_tokens: 240,
              output_tokens: 180,
              total_tokens: 420,
            },
          };
        },
      };
    },
  });
  return {
    adapter,
    transport_calls: () => transportCalls,
    requests: () => requests,
  };
}

function strategicSmokeCostBudgetV01(
  config: VNextLocalOperatorPilotConfigV01,
  options: {
    maximum_permitted_cost?: number;
    pricing_expires_at?: string | null;
  } = {},
) {
  const providerRef = {
    ref_version: "external_ref.v0.1" as const,
    ref_type: "model_provider",
    external_id: "openai",
    provider: "openai",
    trust_class: "direct_local_observation" as const,
  };
  const modelRef = {
    ref_version: "external_ref.v0.1" as const,
    ref_type: "provider_model",
    external_id: "operator-pilot-strategic-fixture-model",
    provider: "openai",
    trust_class: "direct_local_observation" as const,
  };
  const authority = buildModelGatewayCostAuthorityV01({
    authority_kind: "provider_model_pricing_snapshot",
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    purpose: "strategic_advantage_transfer",
    provider_ref: providerRef,
    model_ref: modelRef,
    cost_unit: "operator_pilot_test_credit_microunit",
    input_rate: { unit: "utf8_byte", cost_per_unit: 1 },
    output_rate: { unit: "token", cost_per_unit: 16 },
    pricing_source_version: "operator_pilot_test_pricing.v0.1",
    pricing_effective_at: "2020-01-01T00:00:00.000Z",
    pricing_expires_at: options.pricing_expires_at ?? null,
    project_model_policy_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        policy: "operator_pilot_test_model_policy.v0.1",
        workspace_id: config.workspace_id,
        project_id: config.project_id,
        provider_ref: providerRef,
        model_ref: modelRef,
      }),
    ),
  });
  return buildModelGatewayCostBudgetV01({
    authority,
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    purpose: "strategic_advantage_transfer",
    provider_ref: providerRef,
    model_ref: modelRef,
    maximum_input_units: 65_536,
    maximum_output_units: 2_048,
    timeout_ms: 20_000,
    maximum_permitted_cost: options.maximum_permitted_cost ?? 98_304,
    evaluated_at: "2026-07-11T00:00:00.000Z",
  });
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

  networkGuard = installZeroNetworkGuard({
    allowLoopback: true,
    errorPrefix: "operator_pilot_external_io_blocked",
  });
  const clock = new ManualClock("2026-07-11T00:00:00.000Z");
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
    const concurrentStatuses = concurrentResponses.map(
      (response) => response.status,
    );
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
  ]) {
      assert(
        positiveCases.includes(caseId),
        `missing exact replay case: ${caseId}`,
      );
  }

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
    semantic_authority_granted: true,
    source_assessment_semantic_authority_granted: false,
    real_operator_decision_created: true,
    full_loop_fixture_only: false,
    full_loop_anchors: fullLoop.anchors,
    full_loop_proposal: fullLoop.proposal,
    loopback_http_request_count: fullLoop.loopbackHttpRequestCount,
    backup_restore: "exact_durable_records_and_integrity_preserved",
    enrolled_project_core_record_count: fullLoop.coreRecordCount,
    foreign_project_core_record_count: 0,
    review_did_not_mutate_semantic_state: true,
    packet_compilation_was_explicit: true,
    packet_compilation_was_atomic_with_transition: true,
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
  const locations =
    error instanceof Error
      ? [
          ...new Set(
            [
              ...(error.stack ?? "").matchAll(
                /([A-Za-z0-9_.-]+\.(?:ts|mjs)):(\d+):(\d+)/gu,
              ),
            ].map((match) => `${match[1]}:${match[2]}:${match[3]}`),
          ),
        ].slice(0, 6)
      : [];
  process.stderr.write(
    `operator_pilot_smoke_failed:${message}${locations.length ? `:locations=${locations.join(",")}` : ""}\n`,
  );
  process.exitCode = 1;
});

function initializeCanonicalDatabase(): void {
  assert.equal(existsSync(canonicalDbPath), false);
  const db = new Database(canonicalDbPath);
  try {
    db.pragma("foreign_keys = ON");
    db.exec(schemaSql);
    const table = db
      .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = 'vnext_local_operator_sessions'`,
      )
      .get();
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
    assert.deepEqual(db.prepare("SELECT id, value FROM legacy_guard").all(), [
      { id: "row", value: "unchanged" },
    ]);
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
  sessionHandlers: ReturnType<
    typeof createVNextLocalOperatorSessionHandlersV01
  >;
}): Promise<{
  anchors: Record<string, string>;
  proposal: { proposal_id: string; proposal_fingerprint: string };
  coreRecordCount: number;
  loopbackHttpRequestCount: number;
}> {
  const config = readVNextLocalOperatorPilotConfigV01(input.environment);
  const strategicGateway = createStrategicAdvantageTransferSmokeGatewayV01();
  const nativeReviewHandlers = createVNextOperatorSemanticReviewHandlersV01({
    environment: input.environment,
    clock: input.clock,
    secret_source: input.secretSource,
    strategic_dependencies: {
      adapter: strategicGateway.adapter,
      read_model_capability: () => ({
        status: "available",
        summary:
          "Deterministic fake R4 transport is available for the bounded smoke fixture.",
        verification: "trusted_local_status",
      }),
      read_cost_budget: () => strategicSmokeCostBudgetV01(config),
      open_gateway_database: () =>
        new Database(canonicalDbPath, { fileMustExist: true }),
      now: () => new Date(input.clock.now()),
    },
  });
  const nativeTransitionHandlers =
    createVNextOperatorSemanticTransitionHandlersV01({
    environment: input.environment,
    clock: input.clock,
    secret_source: input.secretSource,
  });
  const nativeContinuityHandler =
    createVNextOperatorProjectContinuityHandlerV01({
    environment: input.environment,
    clock: input.clock,
  });
  const nativeContextUseReviewHandler =
    createVNextOperatorContextUseReviewHandlerV01({
      environment: input.environment,
      clock: input.clock,
      secret_source: input.secretSource,
    });
  const loopback = await startOperatorPilotLoopbackHarness({
    session: input.sessionHandlers,
    semanticReview: nativeReviewHandlers,
    semanticTransition: nativeTransitionHandlers,
    projectContinuity: {
      GET: nativeContinuityHandler,
      POST: nativeContextUseReviewHandler,
    },
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
  const continuityHandler = loopback.forward;

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
  const fixturePriorPacket = buildSemanticReviewLoopTaskContextPacketFixture(
    fixtureProject,
      { data_classification: "public_safe" },
  );
  const priorPacket = fixturePriorPacket;
  const fixtureReceipt = buildSemanticReviewLoopRunReceiptFixture(
    fixtureProject,
    priorPacket,
  );
  const fixtureProposal = buildSemanticReviewLoopProposalFixture(
    fixtureProject,
    priorPacket,
    fixtureReceipt,
      { primary_delta_type: "agent_plan_delta" },
  );
  const preparationDb = openVNextLocalOperatorDatabaseV01(config);
  const prepared = (() => {
    try {
      insertVNextCoreRecordV01(preparationDb, {
        record_kind: "task_context_packet",
        record_id: priorPacket.packet_id,
        workspace_id: priorPacket.workspace_id,
        project_id: priorPacket.project_id,
        fingerprint: priorPacket.integrity.fingerprint,
        idempotency_key: null,
        payload: priorPacket,
        created_at: priorPacket.generated_at,
      });
      admitStructuredRunReceiptV01(preparationDb, fixtureReceipt);
      insertVNextCoreRecordV01(preparationDb, {
        record_kind: "episode_delta_proposal",
        record_id: fixtureProposal.proposal_id,
        workspace_id: fixtureProposal.workspace_id,
        project_id: fixtureProposal.project_id,
        fingerprint: fixtureProposal.integrity.fingerprint,
        idempotency_key: null,
        payload: fixtureProposal,
        created_at: fixtureProposal.created_at,
      });
      return { proposal: fixtureProposal };
    } finally {
      preparationDb.close();
    }
  })();
  pass("provider_neutral_review_material_persisted");

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
        candidate: (typeof prepared.proposal.proposed_deltas)[number];
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
    assert.equal(
      decisionResponse.status,
      201,
      "decision insert over loopback HTTP",
    );
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
      requiredSessionId: gate.operator_confirmation_basis_refs![0]!.external_id,
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
  const rowsBeforeRetiredSplitActions = coreRecordCount(canonicalDbPath);
  for (const action of ["commit", "compile"] as const) {
    await expectRouteError(
      await transitionHandlers.POST(
        routeRequest("/api/vnext/operator/semantic-transition", {
          method: "POST",
          jar,
          body: { action },
        }),
      ),
      400,
      "operator_pilot_transition_action_invalid",
      `retired_split_${action}_action_rejected`,
    );
  }
    assert.equal(
      coreRecordCount(canonicalDbPath),
      rowsBeforeRetiredSplitActions,
    );
  pass("atomic_apply_is_the_only_product_transition_mutation");
  const commitRequest = {
    action: "apply",
    ...decisionBinding,
    gate_record_id: gate.gate_record_id,
    gate_record_fingerprint: gate.integrity.fingerprint,
    prior_packet_id: priorPacket.packet_id,
    prior_packet_fingerprint: priorPacket.integrity.fingerprint,
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
  const laterPacket = commitBody.later_packet as TaskContextPacketV01;
  assert.equal(commitBody.packet_compiled, true);
  assert.equal(isTaskContextPacketIdV01(laterPacket.packet_id), true);
  assert.equal(
    laterPacket.packet_id.slice("task-context-packet:".length).length,
    TASK_CONTEXT_PACKET_ID_HEX_LENGTH_V01,
  );
  const accepted = laterPacket.selected_context.find(
    (entry) => entry.entry_kind === "accepted_state_ref",
  );
  assert(accepted?.external_ref && accepted.source_ref);
  pass("operator_confirmed_transition_and_packet_applied_atomically");

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
  assert.equal(
    (commitReplayBody.later_packet as typeof laterPacket).packet_id,
    laterPacket.packet_id,
  );
  jar.absorb(commitReplayResponse);
  pass("semantic_transition_exact_replay");
  pass("later_packet_compile_exact_replay");
  pass("compiled_packet_uses_canonical_identity");

  await assertWorkbenchDurableLineageRoute({
    handlers: reviewHandlers,
    jar,
    proposal: prepared.proposal,
    expected_status: "packet_compiled",
    receipt,
    packet: laterPacket,
  });
  pass("workbench_lineage_reports_compiled_packet");

  input.clock.set("2026-07-11T09:21:00.000Z");
  const firstLaterRun = await assertDirectHostRoundTripCoverageV01({
    environment: input.environment,
    config,
    clock: input.clock,
    secret_source: input.secretSource,
    jar,
    packet: laterPacket,
    transition_receipt: receipt,
  });

    await assertR6DProductionVerticalV01({
      environment: input.environment,
      config,
      clock: input.clock,
      secret_source: input.secretSource,
      jar,
      review_handlers: reviewHandlers,
      source_run: firstLaterRun,
      gateway: strategicGateway,
    });

  const r6cVertical = await assertR6CProductionVerticalV01({
    environment: input.environment,
    config,
    clock: input.clock,
    secret_source: input.secretSource,
    jar,
    review_handlers: reviewHandlers,
    transition_handlers: transitionHandlers,
    continuity_handler: continuityHandler,
    source_run: firstLaterRun,
  });

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
  };
  assert.equal(
    continuity.latest_compiled_packet?.packet_id,
    r6cVertical.later_packet.packet_id,
  );
  assert.equal(
    continuity.latest_compiled_packet?.packet_fingerprint,
    r6cVertical.later_packet.integrity.fingerprint,
  );
  pass("project_home_continuity_projects_latest_compiled_packet");

  const foreignEnvironment = {
    ...input.environment,
    AUGNES_VNEXT_OPERATOR_PROJECT_ID: FOREIGN_PROJECT_ID,
  };
  const foreignReviewHandlers = createVNextOperatorSemanticReviewHandlersV01({
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
  const foreignRevisionCandidate = prepared.proposal.proposed_deltas[0]!;
  await expectRouteError(
    await foreignReviewHandlers.POST(
      routeRequest("/api/vnext/operator/semantic-review", {
        method: "POST",
        jar,
        body: {
          action: "revise",
          proposal_id: prepared.proposal.proposal_id,
          proposal_fingerprint: prepared.proposal.integrity.fingerprint,
          candidate_id: foreignRevisionCandidate.candidate_id,
            candidate_fingerprint: createEpisodeDeltaCandidateFingerprintV01(
              foreignRevisionCandidate,
            ),
          delta_type: "validation_delta",
          operation: "add",
          title: "Cross-project revision must fail",
          proposed_state_summary:
            "This material must never be admitted outside its project.",
          rationale_summary:
            "Project-scoped operator authority must bind revision admission.",
          uncertainties: [],
          limitations: [],
        },
      }),
    ),
    403,
    "operator_session_scope_mismatch",
    "proposal_revision_cross_project_refused",
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
  };
  const fullLoopFingerprint = `sha256:${createHash("sha256")
    .update(JSON.stringify(canonicalJson(anchors)))
    .digest("hex")}`;
  const anchoredLoop = {
    ...anchors,
    full_loop_fingerprint: fullLoopFingerprint,
  };
  assert.deepEqual(anchoredLoop, EXPECTED_FULL_LOOP_ANCHORS);
  pass("full_loop_fixed_anchors_unchanged");
  assertOperatorLoopbackRouteCoverage(loopback.requests);
  return {
    anchors: anchoredLoop,
    proposal: {
      proposal_id: prepared.proposal.proposal_id,
      proposal_fingerprint: prepared.proposal.integrity.fingerprint,
    },
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
}): Promise<Awaited<ReturnType<typeof runDirectNativeHostRoundTripV01>>> {
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
  let golden: Awaited<ReturnType<typeof runDirectNativeHostRoundTripV01>>;
  try {
    const receiptsBefore = countRowsByKind(db, "run_receipt");
    const proposalsBefore = countRowsByKind(db, "episode_delta_proposal");
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
    assert.equal(
      golden.proposal.status,
      "available",
      JSON.stringify(golden.proposal),
    );
    assert.equal(golden.proposal_created, true);
    assert.equal(
      countRowsByKind(db, "episode_delta_proposal"),
      proposalsBefore + 1,
    );
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
    assert.equal(golden.receipt.execution.basis, "observed");
    assert.equal(
      golden.receipt.checks.every((check) => check.basis === "observed"),
      true,
    );
    assert.equal(
      golden.receipt.observations.filter(
        (observation) => observation.observation_kind === "native_host_action",
      ).length,
      2,
    );
    assert.equal(
      golden.receipt.attestations.some(
        (attestation) =>
          attestation.attestation_kind === "native_host_action_report",
      ),
      false,
    );
    assert.equal(golden.receipt.host_approvals?.length ?? 0, 0);
    assert.equal(golden.receipt.privacy_egress.egress_status, "did_not_occur");
    assert.equal(golden.receipt.privacy_egress.raw_prompt_persisted, false);
    assert.equal(golden.receipt.privacy_egress.raw_output_persisted, false);
    assert.equal(golden.receipt.privacy_egress.raw_transcript_persisted, false);
    assert.equal(
      golden.receipt.privacy_egress.secret_material_persisted,
      false,
    );
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

    const assessmentReadSnapshot = {
      core_records: countTableRows(db, "vnext_core_records"),
      semantic_state_entries: countTableRows(
        db,
        "vnext_semantic_state_entries",
      ),
      proposals: countRowsByKind(db, "episode_delta_proposal"),
      decisions: countRowsByKind(db, "review_decision"),
      transitions: countRowsByKind(db, "state_transition_receipt"),
      packets: countRowsByKind(db, "task_context_packet"),
      receipts: countRowsByKind(db, "run_receipt"),
    };
    const packetBeforeAssessment = readVNextCoreRecordV01(db, {
      record_kind: "task_context_packet",
      record_id: input.packet.packet_id,
      workspace_id: input.config.workspace_id,
      project_id: input.config.project_id,
    });
    assert(packetBeforeAssessment);
    const resultDetail = readProjectRunResultDetailV01(db, {
      workspace_id: input.config.workspace_id,
      project_id: input.config.project_id,
      receipt_id: golden.receipt.receipt_id,
    });
    assert.equal(resultDetail.packet.status, "available");
    assert.equal(
      resultDetail.packet.packet_fingerprint,
      input.packet.integrity.fingerprint,
    );
    assert.equal(resultDetail.summary.mode, "policy_triggered");
    assert.equal(resultDetail.summary.trust_label, "observed");
    assert.equal(resultDetail.actions.length, 2);
    assert.equal(
      resultDetail.actions.every((action) => action.basis === "observed"),
      true,
    );
    assert.deepEqual(
      resultDetail.model_invocations.map((entry) => entry.state),
      ["none"],
    );
    assert.deepEqual(resultDetail.authority, {
      proposal_created: false,
      review_decision_created: false,
      semantic_transition_created: false,
      evidence_accepted: false,
      work_closed: false,
      semantic_state_changed: false,
    });
    assert.equal(resultDetail.criterion_assessment.status, "available");
    if (resultDetail.criterion_assessment.status !== "available") {
      throw new Error("criterion_assessment_not_available");
    }
    const assessment = resultDetail.criterion_assessment.assessment;
    assert.equal(resultDetail.proposal.status, "available");
    if (
      resultDetail.proposal.status !== "available" ||
      golden.proposal.status !== "available"
    ) {
      throw new Error("run_assessment_proposal_not_available");
    }
    const resultProposalId = resultDetail.proposal.proposal_id;
    assert.equal(resultProposalId, golden.proposal.proposal_id);
    assert.equal(
      resultDetail.proposal.proposal_fingerprint,
      golden.proposal.proposal_fingerprint,
    );
    assert.equal(
      resultDetail.proposal.review_href,
      `/workbench/semantic-review/${golden.proposal.proposal_id.replace(":", "~")}`,
    );
    assert.equal(assessment.packet_ref.external_id, input.packet.packet_id);
    assert.equal(
      assessment.packet_ref.source_ref,
      input.packet.integrity.fingerprint,
    );
    assert.equal(assessment.receipt_ref.external_id, golden.receipt.receipt_id);
    assert.equal(
      assessment.receipt_ref.source_ref,
      golden.receipt.integrity.fingerprint,
    );
    assert.equal(assessment.run_id, golden.run_id);
    assert.equal(
      assessment.criteria.length,
      input.packet.task.success_criteria.length,
    );
    assert.deepEqual(
      assessment.criteria.map((item) => item.criterion).sort(),
      [...input.packet.task.success_criteria].sort(),
    );
    assert.equal(
      assessment.criteria.every(
        (item) =>
          item.status === "unknown" &&
          item.basis === "insufficient" &&
          item.supporting_refs.length === 0 &&
          item.opposing_refs.length === 0 &&
          item.missing_refs.length === 0,
      ),
      true,
    );
    assert.equal(resultDetail.skipped_checks.length > 0, true);
    assert.equal(resultDetail.gaps.length > 0, true);
    assert.equal(
      resultDetail.capability_coverage.some(
        (entry) =>
          entry.capability === "repository_command_execution" &&
          entry.coverage_level === "outside_coverage",
      ),
      true,
    );
    assert.equal(resultDetail.trust_summary.direct_observations > 0, true);
    assert.equal(
      assessment.criteria.every((item) =>
        item.uncertainty.some((entry) => entry.includes("was skipped")),
      ),
      true,
    );
    assert.equal(
      assessment.criteria.every((item) =>
        item.operation_coverage.some(
          (entry) =>
            entry.capability === "repository_command_execution" &&
            entry.coverage_level === "outside_coverage",
        ),
      ),
      true,
    );
    assert.deepEqual(assessment.authority, {
      authoritative: false,
      creates_evidence: false,
      validates_claims: false,
      creates_proposal: false,
      creates_decision: false,
      applies_transition: false,
      changes_semantic_state: false,
      changes_later_context: false,
    });
    const proposalReview = readVNextOperatorPilotSemanticReviewV01(db, {
      config: input.config,
      proposal_id: resultProposalId,
      authenticated_session_id: null,
    });
    assert.equal(proposalReview.status, "pending_review");
    assert.equal(proposalReview.decision_count, 0);
    assert.equal(proposalReview.transition.status, "not_applied");
    assert.equal(
      proposalReview.proposal.source_assessment?.assessment
        .assessment_fingerprint,
      assessment.assessment_fingerprint,
    );
    assert.deepEqual(
      proposalReview.proposal.source_assessment?.assessment.criteria,
      assessment.criteria,
    );
    assert.equal(
      proposalReview.proposal.source_assessment?.observed.skipped_checks.length,
      resultDetail.skipped_checks.length,
    );
    assert.equal(
      proposalReview.proposal.source_assessment?.observed.capability_coverage.some(
        (entry) => entry.coverage_level === "outside_coverage",
      ),
      true,
    );
    assert.equal(
      listVNextOperatorPilotSemanticReviewsV01(db, {
        config: input.config,
        authenticated_session_id: null,
      }).some((item) => item.proposal_id === resultProposalId),
      true,
    );
    const repeatedResultDetail = readProjectRunResultDetailV01(db, {
      workspace_id: input.config.workspace_id,
      project_id: input.config.project_id,
      receipt_id: golden.receipt.receipt_id,
    });
    assert.deepEqual(repeatedResultDetail.criterion_assessment, {
      status: "available",
      assessment,
    });
    await withOperatorDatabaseCloneV01(
      "run-assessment-proposal-exact-readback-conflict",
      input.environment,
      async ({ config }) => {
        const conflictDb = openVNextLocalOperatorDatabaseV01(config);
        try {
          const stored = readVNextCoreRecordV01(conflictDb, {
            record_kind: "episode_delta_proposal",
            record_id: resultProposalId,
            workspace_id: config.workspace_id,
            project_id: config.project_id,
          });
          assert(stored);
          const forged = structuredClone(
            stored.payload,
          ) as EpisodeDeltaProposalV01;
          const check = forged.source_assessment?.observed.checks.find(
            (item) => item.status === "passed",
          );
          assert(check);
          check.status = "failed";
          forged.proposal_id = deriveEpisodeDeltaProposalIdV01(forged);
          forged.integrity.fingerprint =
            createEpisodeDeltaProposalFingerprintV01(forged);
          conflictDb.exec(
            "DROP TRIGGER trg_vnext_core_records_immutable_update",
          );
          conflictDb
            .prepare(
              `UPDATE vnext_core_records
               SET record_id = ?, fingerprint = ?, payload_json = ?
               WHERE record_kind = 'episode_delta_proposal'
                 AND record_id = ?`,
            )
            .run(
              forged.proposal_id,
              forged.integrity.fingerprint,
              canonicalizeProtocolValueV01(forged),
              resultProposalId,
            );
          conflictDb.exec(`
            CREATE TRIGGER trg_vnext_core_records_immutable_update
              BEFORE UPDATE ON vnext_core_records
              BEGIN SELECT RAISE(ABORT, 'vnext_core_records_immutable'); END
          `);
          assert.throws(
            () =>
              readProjectRunResultDetailV01(conflictDb, {
                workspace_id: config.workspace_id,
                project_id: config.project_id,
                receipt_id: golden.receipt.receipt_id,
              }),
            (error) =>
              error instanceof ProjectRunResultReadErrorV01 &&
              error.code === "project_result_proposal_material_conflict",
          );
        } finally {
          conflictDb.close();
        }
      },
    );
    assert.deepEqual(
      {
        core_records: countTableRows(db, "vnext_core_records"),
        semantic_state_entries: countTableRows(
          db,
          "vnext_semantic_state_entries",
        ),
        proposals: countRowsByKind(db, "episode_delta_proposal"),
        decisions: countRowsByKind(db, "review_decision"),
        transitions: countRowsByKind(db, "state_transition_receipt"),
        packets: countRowsByKind(db, "task_context_packet"),
        receipts: countRowsByKind(db, "run_receipt"),
      },
      assessmentReadSnapshot,
    );
    assert.deepEqual(
      readVNextCoreRecordV01(db, {
        record_kind: "task_context_packet",
        record_id: input.packet.packet_id,
        workspace_id: input.config.workspace_id,
        project_id: input.config.project_id,
      }),
      packetBeforeAssessment,
    );

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
    assert.equal(replay.proposal.status, "available");
    assert.equal(
      replay.proposal.status === "available"
        ? replay.proposal.admission_status
        : null,
      "exact_replay",
    );
    assert.equal(replay.proposal_created, false);
    assert.equal(
      countRowsByKind(db, "episode_delta_proposal"),
      proposalsBefore + 1,
    );
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
  pass("direct_host_persisted_packet_receipt_criterion_assessment_read_only");
  pass("direct_host_assessment_proposal_pending_review_vertical");

  assertDirectHostRepositoryRelativePathContractV01(
    observed,
    golden.host_result!,
  );
  await assertCriterionAssessmentBindingRefusalsOnClonesV01({
    environment: input.environment,
    packet: input.packet,
    receipt: golden.receipt,
  });
  await assertInteractiveHostRouteOnCloneV01(input);
  await assertRunAssessmentProposalFailureSettlementOnCloneV01(input);
  await assertDirectHostTerminalScenariosOnClonesV01(input);
  await assertDirectHostStopSettlementOnClonesV01(input);
  await assertDirectHostRepositoryRelativePathPersistenceOnCloneV01(input);
  await assertDirectHostPrestartRefusalsOnClonesV01(input);
  await assertDirectHostRootScopesOnClonesV01(input);
  await assertLiveCodexAppServerLifecycleOnClonesV01(input);
  return golden;
}

async function assertR6CProductionVerticalV01(input: {
  environment: NodeJS.ProcessEnv;
  config: VNextLocalOperatorPilotConfigV01;
  clock: ManualClock;
  secret_source: DeterministicSecretSource;
  jar: RouteCookieJar;
  review_handlers: {
    GET: OperatorPilotRouteHandlerV01;
    POST: OperatorPilotRouteHandlerV01;
  };
  transition_handlers: {
    GET: OperatorPilotRouteHandlerV01;
    POST: OperatorPilotRouteHandlerV01;
  };
  continuity_handler: OperatorPilotRouteHandlerV01;
  source_run: Awaited<ReturnType<typeof runDirectNativeHostRoundTripV01>>;
}): Promise<{ later_packet: TaskContextPacketV01 }> {
  assert.equal(input.source_run.proposal.status, "available");
  if (input.source_run.proposal.status !== "available") {
    throw new Error("r6_c_source_proposal_unavailable");
  }
  const sourceProposalId = input.source_run.proposal.proposal_id;
  const sourceDetailResponse = await input.review_handlers.GET(
    routeRequest("/api/vnext/operator/semantic-review", {
      method: "GET",
      jar: input.jar,
      query: { proposal_id: sourceProposalId },
    }),
  );
  const sourceDetailBody = await publicJson(sourceDetailResponse);
  assert.equal(sourceDetailResponse.status, 200);
  const sourceDetail =
    sourceDetailBody.proposal as VNextOperatorPilotReviewDetailV01;
  const unknownCandidate = sourceDetail.candidates.find(
    (entry) => entry.candidate.operation === "unknown",
  );
  assert(unknownCandidate);
  assert.equal(unknownCandidate.pilot_admission.decision_allowed.accept, false);
  assert.equal(unknownCandidate.pilot_admission.mapped_operation, null);
  pass("r6_b_unknown_candidate_not_transition_ready");

  await expectRouteError(
    await input.review_handlers.POST(
      routeRequest("/api/vnext/operator/semantic-review", {
        method: "POST",
        jar: input.jar,
        body: {
          proposal_id: sourceDetail.proposal.proposal_id,
          proposal_fingerprint: sourceDetail.proposal.integrity.fingerprint,
          candidate_id: unknownCandidate.candidate.candidate_id,
          candidate_fingerprint: unknownCandidate.candidate_fingerprint,
          decision: "accept",
          rationale_summary: "Unknown candidate must not apply.",
        },
      }),
    ),
    409,
    "pilot_candidate_operation_not_transitionable",
    "unknown_candidate_accept_refused",
  );

  input.clock.set("2026-07-11T09:22:00.000Z");
  const revisionRequest = {
    action: "revise" as const,
    proposal_id: sourceDetail.proposal.proposal_id,
    proposal_fingerprint: sourceDetail.proposal.integrity.fingerprint,
    candidate_id: unknownCandidate.candidate.candidate_id,
    candidate_fingerprint: unknownCandidate.candidate_fingerprint,
    delta_type: "validation_delta" as const,
    operation: "add" as const,
    title: "Record bounded validation state for later review",
    proposed_state_summary:
      "Create one bounded validation state that preserves unknown criterion status and requires later feedback.",
    rationale_summary:
      "The exact target is absent and this immutable revision explicitly selects create without changing source assessment residue.",
    uncertainties: ["Task success remains unknown and insufficient."],
    limitations: ["The revision is candidate material only."],
  };
  await expectRouteError(
    await input.review_handlers.POST(
      routeRequest("/api/vnext/operator/semantic-review", {
        method: "POST",
        jar: input.jar,
        body: { ...revisionRequest, unexpected_revision_field: true },
      }),
    ),
    400,
    "operator_pilot_revision_body_unknown_field",
    "proposal_revision_unknown_field_refused",
  );
  await expectRouteError(
    await input.review_handlers.POST(
      routeRequest("/api/vnext/operator/semantic-review", {
        method: "POST",
        jar: input.jar,
        body: { ...revisionRequest, title: "x".repeat(2001) },
      }),
    ),
    400,
    "operator_pilot_revision_title_invalid",
    "proposal_revision_oversized_edit_refused",
  );
  const incompatibleDeltaTypes = [
    "research_delta",
    "memory_delta",
    "perspective_delta",
    "artifact_delta",
    "code_delta",
    "world_state_delta",
    "agent_plan_delta",
    "user_decision_delta",
    "coordination_delta",
  ] as const;
  for (const deltaType of incompatibleDeltaTypes) {
    await expectRouteError(
      await input.review_handlers.POST(
        routeRequest("/api/vnext/operator/semantic-review", {
          method: "POST",
          jar: input.jar,
          body: { ...revisionRequest, delta_type: deltaType },
        }),
      ),
      409,
      "operator_pilot_revision_delta_target_incompatible",
      `criterion_target_${deltaType}_refused`,
    );
  }
  const revisionResponse = await input.review_handlers.POST(
    routeRequest("/api/vnext/operator/semantic-review", {
      method: "POST",
      jar: input.jar,
      body: revisionRequest,
    }),
  );
  const revisionBody = await publicJson(revisionResponse);
  assert.equal(revisionResponse.status, 201, JSON.stringify(revisionBody));
  input.jar.absorb(revisionResponse);
  const revisionProposal = revisionBody.proposal as EpisodeDeltaProposalV01;
  assert.equal(revisionProposal.status, "pending_review");
  assert.equal(
    revisionProposal.operation_revision?.selected_delta_type,
    "validation_delta",
  );
  assert.equal(revisionProposal.operation_revision?.selected_operation, "add");
  assert.equal(
    revisionProposal.operation_revision?.source.proposal_id,
    sourceDetail.proposal.proposal_id,
  );
  assert.equal(
    canonicalizeProtocolValueV01(revisionProposal.source_assessment),
    canonicalizeProtocolValueV01(sourceDetail.proposal.source_assessment),
  );
  const sourceAfterRevisionResponse = await input.review_handlers.GET(
    routeRequest("/api/vnext/operator/semantic-review", {
      method: "GET",
      jar: input.jar,
      query: { proposal_id: sourceDetail.proposal.proposal_id },
    }),
  );
  const sourceAfterRevision = (await publicJson(sourceAfterRevisionResponse))
    .proposal as VNextOperatorPilotReviewDetailV01;
  assert.equal(
    sourceAfterRevision.proposal.integrity.fingerprint,
    sourceDetail.proposal.integrity.fingerprint,
  );
  assert.equal(sourceAfterRevision.proposal.operation_revision, undefined);
  pass("immutable_operation_aware_revision_preserves_source_proposal");
  await assertOperationRevisionImmutableMaterialConflictOnCloneV01({
    environment: input.environment,
    proposal: revisionProposal,
  });
  await assertOperationRevisionDeltaTargetConflictOnCloneV01({
    environment: input.environment,
    proposal: revisionProposal,
  });

  const replayRevisionResponse = await input.review_handlers.POST(
    routeRequest("/api/vnext/operator/semantic-review", {
      method: "POST",
      jar: input.jar,
      body: revisionRequest,
    }),
  );
  const replayRevisionBody = await publicJson(replayRevisionResponse);
  assert.equal(replayRevisionBody.status, "exact_replay");
  assert.equal(
    (replayRevisionBody.proposal as EpisodeDeltaProposalV01).proposal_id,
    revisionProposal.proposal_id,
  );
  input.jar.absorb(replayRevisionResponse);
  pass("proposal_revision_exact_replay");
  await expectRouteError(
    await input.review_handlers.POST(
      routeRequest("/api/vnext/operator/semantic-review", {
        method: "POST",
        jar: input.jar,
        body: { ...revisionRequest, title: "Conflicting revision content" },
      }),
    ),
    409,
    "operator_pilot_revision_replay_conflict",
    "proposal_revision_conflicting_replay_refused",
  );

  const revisionDetailResponse = await input.review_handlers.GET(
    routeRequest("/api/vnext/operator/semantic-review", {
      method: "GET",
      jar: input.jar,
      query: { proposal_id: revisionProposal.proposal_id },
    }),
  );
  const revisionDetail = (await publicJson(revisionDetailResponse))
    .proposal as VNextOperatorPilotReviewDetailV01;
  const revisedCandidate = revisionDetail.candidates.find(
    (entry) =>
      entry.candidate.candidate_id ===
      revisionProposal.operation_revision?.revised_candidate.candidate_id,
  );
  assert(revisedCandidate);
  assert.equal(revisedCandidate.candidate.operation, "add");
  assert.equal(revisedCandidate.pilot_admission.accept_operation, "create");
  assert.equal(revisedCandidate.pilot_admission.decision_allowed.accept, true);

  input.clock.set("2026-07-11T09:23:00.000Z");
  const beforeDecision = snapshotR6CSemanticAuthorityCounts(input.config);
  const decisionRequest = {
    proposal_id: revisionProposal.proposal_id,
    proposal_fingerprint: revisionProposal.integrity.fingerprint,
    candidate_id: revisedCandidate.candidate.candidate_id,
    candidate_fingerprint: revisedCandidate.candidate_fingerprint,
    decision: "accept" as const,
    rationale_summary:
      "Explicitly accept the separately reviewable create candidate; this decision remains distinct from application.",
  };
  const decisionResponse = await input.review_handlers.POST(
    routeRequest("/api/vnext/operator/semantic-review", {
      method: "POST",
      jar: input.jar,
      body: decisionRequest,
    }),
  );
  const decisionBody = await publicJson(decisionResponse);
  assert.equal(decisionResponse.status, 201, JSON.stringify(decisionBody));
  input.jar.absorb(decisionResponse);
  const decision = decisionBody.decision as ReviewDecisionV01;
  const stateBeforeApply = snapshotR6CSemanticAuthorityCounts(input.config);
  assert.equal(stateBeforeApply.decisions, beforeDecision.decisions + 1);
  assert.deepEqual(
    { ...stateBeforeApply, decisions: beforeDecision.decisions },
    beforeDecision,
  );
  pass("review_decision_persisted_without_semantic_state_change");

  input.clock.set("2026-07-11T09:24:00.000Z");
  const decisionBinding = {
    proposal_id: revisionProposal.proposal_id,
    proposal_fingerprint: revisionProposal.integrity.fingerprint,
    decision_id: decision.decision_id,
    decision_fingerprint: decision.integrity.fingerprint,
  };
  const previewResponse = await input.transition_handlers.GET(
    routeRequest("/api/vnext/operator/semantic-transition", {
      method: "GET",
      jar: input.jar,
      query: decisionBinding,
    }),
  );
  const previewBody = await publicJson(previewResponse);
  assert.equal(previewResponse.status, 200, JSON.stringify(previewBody));
  input.jar.absorb(previewResponse);
  const previewPolicy = previewBody.pilot_policy as {
    operation_aware: boolean;
    candidate_operation: string;
  };
  const preview = previewBody.preview as VNextSemanticCommitPreviewV01;
  assert.equal(previewPolicy.operation_aware, true);
  assert.equal(previewPolicy.candidate_operation, "create");
  assert.equal(previewBody.preview_is_write, false);
  const confirmResponse = await input.transition_handlers.POST(
    routeRequest("/api/vnext/operator/semantic-transition", {
      method: "POST",
      jar: input.jar,
      body: {
        action: "confirm",
        ...decisionBinding,
        confirmation_digest: preview.confirmation_digest,
      },
    }),
  );
  const confirmBody = await publicJson(confirmResponse);
  assert.equal(confirmResponse.status, 201, JSON.stringify(confirmBody));
  input.jar.absorb(confirmResponse);
  const gate = confirmBody.gate_record as VNextSemanticCommitGateRecordV01;

  input.clock.set("2026-07-11T09:25:00.000Z");
  const applyRequest = {
    action: "apply",
    ...decisionBinding,
    gate_record_id: gate.gate_record_id,
    gate_record_fingerprint: gate.integrity.fingerprint,
    prior_packet_id: revisionProposal.task_context_packet_ref!.external_id,
    prior_packet_fingerprint:
      revisionProposal.task_context_packet_ref!.source_ref!,
  };
  await assertAtomicTransitionPacketRollbackOnCloneV01({
    environment: input.environment,
    clock: input.clock,
    secret_source: input.secret_source,
    jar: input.jar,
    request: applyRequest,
  });
  const applyResponse = await input.transition_handlers.POST(
    routeRequest("/api/vnext/operator/semantic-transition", {
      method: "POST",
      jar: input.jar,
      body: applyRequest,
    }),
  );
  const applyBody = await publicJson(applyResponse);
  assert.equal(applyResponse.status, 201, JSON.stringify(applyBody));
  assert.equal(applyBody.status, "applied");
  assert.equal(applyBody.packet_status, "inserted");
  assert.equal(applyBody.packet_compiled, true);
  input.jar.absorb(applyResponse);
  const transition = applyBody.transition_receipt as StateTransitionReceiptV01;
  const laterPacket = applyBody.later_packet as TaskContextPacketV01;
  assert.equal(
    transition.effects.every((effect) => effect.operation === "create"),
    true,
  );
  assert.equal(
    laterPacket.selected_context.some(
      (entry) =>
        entry.entry_kind === "accepted_state_ref" &&
        entry.source_ref ===
          transition.effects[0]!.after_state.state_fingerprint,
    ),
    true,
  );
  pass("operation_aware_decision_transition_receipt_and_packet_vertical");

  input.clock.set("2026-07-11T09:26:00.000Z");
  const replayApplyResponse = await input.transition_handlers.POST(
    routeRequest("/api/vnext/operator/semantic-transition", {
      method: "POST",
      jar: input.jar,
      body: applyRequest,
    }),
  );
  const replayApplyBody = await publicJson(replayApplyResponse);
  assert.equal(replayApplyBody.status, "exact_replay");
  assert.equal(replayApplyBody.packet_status, "exact_replay");
  assert.equal(
    (replayApplyBody.transition_receipt as StateTransitionReceiptV01)
      .transition_receipt_id,
    transition.transition_receipt_id,
  );
  assert.equal(
    (replayApplyBody.later_packet as TaskContextPacketV01).packet_id,
    laterPacket.packet_id,
  );
  input.jar.absorb(replayApplyResponse);
  pass("atomic_transition_packet_exact_replay");

  input.clock.set("2026-07-11T09:27:00.000Z");
  const laterRunDb = openVNextLocalOperatorDatabaseV01(input.config);
  let laterRun: Awaited<ReturnType<typeof runDirectNativeHostRoundTripV01>>;
  try {
    const adapter = createDeterministicCodexAdapterV01({
      now: () => input.clock.now(),
    });
    laterRun = await runDirectNativeHostRoundTripV01(
      laterRunDb,
      { config: input.config, mode: "interactive" },
      { adapter, now: () => input.clock.now() },
    );
  } finally {
    laterRunDb.close();
  }
  assert.equal(laterRun.status, "inserted");
  assert.equal(laterRun.mode, "interactive");
  assert.equal(
    laterRun.receipt.task_context_packet_ref?.external_id,
    laterPacket.packet_id,
  );
  assert.equal(
    laterRun.receipt.compatibility.source_contracts.includes(
      "vnext_operator_pilot_later_result_intake.v0.1",
    ),
    true,
  );
  assert.equal(laterRun.proposal.status, "available");
  if (laterRun.proposal.status !== "available") {
    throw new Error("r6_c_later_run_proposal_unavailable");
  }
  pass("real_later_interactive_run_receipt_persisted");
  await assertOperationAwareProductionOperationsOnClonesV01({
    environment: input.environment,
    clock: input.clock,
    secret_source: input.secret_source,
    source_proposal_id: laterRun.proposal.proposal_id,
  });

  const beforeFeedback = snapshotR6CSemanticAuthorityCounts(input.config);
  input.clock.set("2026-07-11T09:28:00.000Z");
  const feedbackRequest = {
    action: "record_context_use_review",
    later_run_receipt_id: laterRun.receipt.receipt_id,
    later_run_receipt_fingerprint: laterRun.receipt.integrity.fingerprint,
    actually_used: "yes",
    assessment: "helpful",
    correction_summaries: [],
    notes: [
      "The accepted validation state was presented and useful in the real later run.",
    ],
    metrics: {
      wrong_context_correction_count: 0,
      repeated_explanation_estimate: 0,
      missing_critical_context_count: 0,
      context_refs_used_count: 1,
    },
  };
  const feedbackResponse = await input.continuity_handler(
    routeRequest("/api/vnext/operator/project-continuity", {
      method: "POST",
      jar: input.jar,
      body: feedbackRequest,
    }),
  );
  const feedbackBody = await publicJson(feedbackResponse);
  assert.equal(feedbackResponse.status, 201, JSON.stringify(feedbackBody));
  input.jar.absorb(feedbackResponse);
  const feedbackReview = feedbackBody.review as ContextUseReviewV01;
  assert.equal(feedbackReview.usage.presented, "yes");
  assert.equal(feedbackReview.usage.actually_used, "yes");
  assert.equal(feedbackReview.assessment, "helpful");
  assert.equal(
    feedbackReview.usage_provenance?.presented.basis,
    "direct_local_observation",
  );
  assert.deepEqual(
    feedbackReview.usage_provenance?.presented.source_refs,
    laterRun.receipt.checks.find(
      (check) => check.check_id === "deterministic_packet_delivery",
    )?.source_refs,
  );
  assert.equal(
    feedbackReview.usage_provenance?.actually_used.basis,
    "user_declaration",
  );
  assert.equal(
    feedbackReview.usage_provenance?.assessment.basis,
    "user_declaration",
  );
  const requestRef = feedbackReview.compatibility.external_refs[0]!;
  for (const actuallyUsed of ["yes", "partial", "no"] as const) {
    const provenance = deriveVNextOperatorPilotContextUseUsageProvenanceV01({
        receipt: laterRun.receipt,
        actually_used: actuallyUsed,
        request_ref: requestRef,
      });
    assert.equal(provenance.actually_used.basis, "user_declaration");
    assert.deepEqual(provenance.actually_used.source_refs, [requestRef]);
  }
  const unknownProvenance =
    deriveVNextOperatorPilotContextUseUsageProvenanceV01({
      receipt: laterRun.receipt,
      actually_used: "unknown",
      request_ref: requestRef,
    });
  assert.equal(unknownProvenance.actually_used.basis, "unknown");
  assert.deepEqual(unknownProvenance.actually_used.source_refs, []);
  const unrelatedResidue = structuredClone(laterRun.receipt);
  unrelatedResidue.trust_summary.direct_observations += 100;
  unrelatedResidue.trust_summary.host_attestations += 100;
  unrelatedResidue.trust_summary.provider_reports += 100;
  unrelatedResidue.observations.push({
    observation_id: "unrelated:direct-observation",
    observation_kind: "unrelated_task_residue",
    summary: "Unrelated direct task observation.",
    event_at: laterRun.receipt.recorded_at,
    observed_at: laterRun.receipt.recorded_at,
    observer_ref: laterRun.receipt.reporter_ref,
    trust_class: "direct_local_observation",
    source_refs: [laterRun.receipt.reporter_ref],
    related_command_ids: [],
    related_check_ids: [],
    related_artifact_refs: [],
  });
  unrelatedResidue.attestations.push(
    {
      attestation_id: "unrelated:host-attestation",
      attestation_kind: "unrelated_task_residue",
      summary: "Unrelated host task attestation.",
      reported_at: laterRun.receipt.recorded_at,
      reporter_ref: {
        ...laterRun.receipt.reporter_ref,
        external_id: "unrelated-host",
        trust_class: "host_attestation",
      },
      trust_class: "host_attestation",
      source_refs: [],
      subject_refs: [],
    },
    {
      attestation_id: "unrelated:provider-report",
      attestation_kind: "unrelated_task_residue",
      summary: "Unrelated provider task report.",
      reported_at: laterRun.receipt.recorded_at,
      reporter_ref: {
        ...laterRun.receipt.reporter_ref,
        external_id: "unrelated-provider",
        trust_class: "provider_report",
      },
      trust_class: "provider_report",
      source_refs: [],
      subject_refs: [],
    },
  );
  const unrelatedResidueProvenance =
    deriveVNextOperatorPilotContextUseUsageProvenanceV01({
      receipt: unrelatedResidue,
      actually_used: "yes",
      request_ref: requestRef,
    });
  assert.equal(
    unrelatedResidueProvenance.actually_used.basis,
    "user_declaration",
  );
  pass("context_use_review_usage_provenance_remains_source_truthful");
  await assertContextUseReviewProvenanceConflictOnCloneV01({
    environment: input.environment,
    review: feedbackReview,
  });
  assert.equal(feedbackBody.semantic_state_changed, false);
  assert.equal(feedbackBody.transition_created, false);
  assert.equal(feedbackBody.packet_created, false);
  const afterFeedback = snapshotR6CSemanticAuthorityCounts(input.config);
  assert.equal(
    afterFeedback.context_use_reviews,
    beforeFeedback.context_use_reviews + 1,
  );
  assert.deepEqual(
    {
      ...afterFeedback,
      context_use_reviews: beforeFeedback.context_use_reviews,
    },
    beforeFeedback,
  );
  pass("context_use_review_non_authoritative_no_mutation");

  const feedbackReplayResponse = await input.continuity_handler(
    routeRequest("/api/vnext/operator/project-continuity", {
      method: "POST",
      jar: input.jar,
      body: feedbackRequest,
    }),
  );
  const feedbackReplayBody = await publicJson(feedbackReplayResponse);
  assert.equal(feedbackReplayBody.status, "exact_replay");
  input.jar.absorb(feedbackReplayResponse);
  pass("context_use_review_exact_replay");
  await expectRouteError(
    await input.continuity_handler(
      routeRequest("/api/vnext/operator/project-continuity", {
        method: "POST",
        jar: input.jar,
        body: { ...feedbackRequest, assessment: "noisy" },
      }),
    ),
    409,
    "operator_pilot_context_use_review_replay_conflict",
    "context_use_review_conflicting_replay_refused",
  );

  const continuityResponse = await input.continuity_handler(
    routeRequest("/api/vnext/operator/project-continuity", {
      method: "GET",
      jar: input.jar,
    }),
  );
  const continuity = (await publicJson(continuityResponse)).continuity as {
    latest_context_use_review_status: {
      review_id: string;
      actually_used: string;
      actually_used_basis: string | null;
      presentation_basis: string | null;
      assessment_basis: string | null;
      assessment: string;
    } | null;
  };
  assert.equal(
    continuity.latest_context_use_review_status?.assessment,
    "helpful",
  );
  assert.equal(
    continuity.latest_context_use_review_status?.actually_used,
    "yes",
  );
  assert.equal(
    continuity.latest_context_use_review_status?.actually_used_basis,
    "user_declaration",
  );
  assert.equal(
    continuity.latest_context_use_review_status?.presentation_basis,
    "direct_local_observation",
  );
  assert.equal(
    continuity.latest_context_use_review_status?.assessment_basis,
    "user_declaration",
  );
  pass("workbench_continuity_reads_context_use_feedback_lineage");
  return { later_packet: laterPacket };
}

async function assertR6DProductionVerticalV01(input: {
  environment: NodeJS.ProcessEnv;
  config: VNextLocalOperatorPilotConfigV01;
  clock: ManualClock;
  secret_source: DeterministicSecretSource;
  jar: RouteCookieJar;
  review_handlers: {
    GET: OperatorPilotRouteHandlerV01;
    POST: OperatorPilotRouteHandlerV01;
  };
  source_run: Awaited<ReturnType<typeof runDirectNativeHostRoundTripV01>>;
  gateway: StrategicAdvantageTransferSmokeGatewayV01;
}): Promise<void> {
  assert.throws(
    () => selectUniqueStrategicBaseV01([]),
    /base_strategy_missing/,
  );
  assert.equal(selectUniqueStrategicBaseV01(["only-base"]), "only-base");
  for (const candidates of [
    ["base-a", "base-b"],
    ["base-b", "base-a"],
  ]) {
    assert.throws(
      () => selectUniqueStrategicBaseV01(candidates),
      /base_strategy_ambiguous/,
    );
  }
  pass("strategic_base_selection_is_unique_and_order_independent");
  assert.equal(input.source_run.proposal.status, "available");
  if (input.source_run.proposal.status !== "available") {
    throw new Error("r6_d_source_proposal_unavailable");
  }
  const proposalId = input.source_run.proposal.proposal_id;
  const db = openVNextLocalOperatorDatabaseV01(input.config);
  const sourceBefore = (() => {
    try {
      const record = readVNextCoreRecordV01(db, {
        record_kind: "episode_delta_proposal",
        record_id: proposalId,
        workspace_id: input.config.workspace_id,
        project_id: input.config.project_id,
      });
      assert(record);
      return canonicalizeProtocolValueV01(record.payload);
    } finally {
      db.close();
    }
  })();
  const beforeReads = snapshotR6CSemanticAuthorityCounts(input.config);
  const sourceDetailResponse = await input.review_handlers.GET(
    routeRequest("/api/vnext/operator/semantic-review", {
      method: "GET",
      jar: input.jar,
      query: { proposal_id: proposalId },
    }),
  );
  const sourceDetailBody = await publicJson(sourceDetailResponse);
  assert.equal(
    sourceDetailResponse.status,
    200,
    JSON.stringify(sourceDetailBody),
  );
  const sourceDetail =
    sourceDetailBody.proposal as VNextOperatorPilotReviewDetailV01 & {
      strategic_analysis: {
        status: string;
        base_label: string | null;
        lenses: readonly string[];
        optional: boolean;
        authoritative: boolean;
      };
    };
  assert.equal(sourceDetail.proposal.proposal_id, proposalId);
  assert.equal(sourceDetail.proposal.status, "pending_review");
  assert.equal(sourceDetail.strategic_analysis.status, "eligible");
  assert.equal(sourceDetail.strategic_analysis.optional, true);
  assert.equal(sourceDetail.strategic_analysis.authoritative, false);
  assert((sourceDetail.strategic_analysis.base_label ?? "").length > 0);
  assert.deepEqual(sourceDetail.strategic_analysis.lenses, [
    "constraint_fit",
    "verification_leverage",
    "regression_safety",
  ]);
  const listBeforeResponse = await input.review_handlers.GET(
    routeRequest("/api/vnext/operator/semantic-review", {
      method: "GET",
      jar: input.jar,
    }),
  );
  assert.equal(listBeforeResponse.status, 200);
  assert.equal(input.gateway.transport_calls(), 0);
  assert.deepEqual(
    snapshotR6CSemanticAuthorityCounts(input.config),
    beforeReads,
  );
  pass("strategic_page_load_and_queue_read_invoke_no_model_or_write");

  const unavailableHandlers = createVNextOperatorSemanticReviewHandlersV01({
    environment: input.environment,
    clock: input.clock,
    secret_source: input.secret_source,
    strategic_dependencies: {
      read_model_capability: () => ({
        status: "unavailable",
        summary:
          "No model capability is enabled for the unavailable-path smoke fixture.",
        verification: "trusted_local_status",
      }),
    },
  });
  const costUnavailableHandlers =
    createVNextOperatorSemanticReviewHandlersV01({
      environment: input.environment,
      clock: input.clock,
      secret_source: input.secret_source,
      strategic_dependencies: {
        read_model_capability: () => ({
          status: "available",
          summary: "A model route is configured for the cost-authority refusal fixture.",
          verification: "trusted_local_status",
        }),
      },
    });
  const costUnavailableDetail = await publicJson(
    await costUnavailableHandlers.GET(
      routeRequest("/api/vnext/operator/semantic-review", {
        method: "GET",
        jar: input.jar,
        query: { proposal_id: proposalId },
      }),
    ),
  );
  assert.equal(
    (
      costUnavailableDetail.proposal as {
        strategic_analysis: { status: string; reason: string };
      }
    ).strategic_analysis.status,
    "unavailable",
  );
  assert.equal(
    (
      costUnavailableDetail.proposal as {
        strategic_analysis: { status: string; reason: string };
      }
    ).strategic_analysis.reason,
    "cost_authority_unavailable",
  );
  const unavailableDetailResponse = await unavailableHandlers.GET(
    routeRequest("/api/vnext/operator/semantic-review", {
      method: "GET",
      jar: input.jar,
      query: { proposal_id: proposalId },
    }),
  );
  const unavailableDetailBody = await publicJson(unavailableDetailResponse);
  assert.equal(unavailableDetailResponse.status, 200);
  assert.equal(
    (
      unavailableDetailBody.proposal as {
        strategic_analysis: { status: string };
      }
    ).strategic_analysis.status,
    "unavailable",
  );
  const analysisRequest = {
    action: "request_strategic_advantage_transfer" as const,
    proposal_id: sourceDetail.proposal.proposal_id,
    proposal_fingerprint: sourceDetail.proposal.integrity.fingerprint,
  };
  const costUnavailableResponse = await costUnavailableHandlers.POST(
    routeRequest("/api/vnext/operator/semantic-review", {
      method: "POST",
      jar: input.jar,
      body: analysisRequest,
    }),
  );
  const costUnavailableBody = await publicJson(costUnavailableResponse);
  assert.equal(costUnavailableResponse.status, 200);
  assert.equal(costUnavailableBody.status, "unavailable");
  assert.equal(costUnavailableBody.reason, "cost_authority_unavailable");
  assert.equal(costUnavailableBody.retryable, false);
  assert.equal(costUnavailableBody.model_invocation_count, 0);
  assert.equal(input.gateway.transport_calls(), 0);
  assert.deepEqual(snapshotR6CSemanticAuthorityCounts(input.config), beforeReads);
  pass("strategic_cost_authority_unavailable_blocks_before_egress");
  for (const costFailure of [
    {
      label: "exceeded",
      reason: "strategic_advantage_transfer_cost_budget_exceeded",
      read: () =>
        strategicSmokeCostBudgetV01(input.config, {
          maximum_permitted_cost: 98_303,
        }),
    },
    {
      label: "stale",
      reason: "strategic_advantage_transfer_pricing_stale",
      read: () =>
        strategicSmokeCostBudgetV01(input.config, {
          pricing_expires_at: "2026-07-01T00:00:00.000Z",
        }),
    },
  ]) {
    const handlers = createVNextOperatorSemanticReviewHandlersV01({
      environment: input.environment,
      clock: input.clock,
      secret_source: input.secret_source,
      strategic_dependencies: {
        read_model_capability: () => ({
          status: "available",
          summary: `Cost ${costFailure.label} fixture model capability is available.`,
          verification: "trusted_local_status",
        }),
        read_cost_budget: costFailure.read,
      },
    });
    const response = await handlers.POST(
      routeRequest("/api/vnext/operator/semantic-review", {
        method: "POST",
        jar: input.jar,
        body: analysisRequest,
      }),
    );
    const body = await publicJson(response);
    assert.equal(response.status, 200);
    assert.equal(body.status, "unavailable");
    assert.equal(body.reason, costFailure.reason);
    assert.equal(body.retryable, false);
    assert.equal(body.model_invocation_count, 0);
    assert.equal(input.gateway.transport_calls(), 0);
  }
  assert.deepEqual(snapshotR6CSemanticAuthorityCounts(input.config), beforeReads);
  pass("strategic_cost_exceeded_and_stale_pricing_fail_before_egress");
  const transportCallsBeforeBindingRefusal = input.gateway.transport_calls();
  await expectRouteError(
    await input.review_handlers.POST(
      routeRequest("/api/vnext/operator/semantic-review", {
        method: "POST",
        jar: input.jar,
        body: {
          ...analysisRequest,
          proposal_fingerprint: `sha256:${"0".repeat(64)}`,
        },
      }),
    ),
    409,
    "strategic_advantage_transfer_source_proposal_conflict",
    "strategic_source_proposal_fingerprint_conflict_refused_before_model",
  );
  assert.equal(
    input.gateway.transport_calls(),
    transportCallsBeforeBindingRefusal,
  );
  await expectRouteError(
    await input.review_handlers.POST(
      routeRequest("/api/vnext/operator/semantic-review", {
        method: "POST",
        jar: input.jar,
        body: {
          ...analysisRequest,
          source_catalog: { forged: true },
        },
      }),
    ),
    400,
    "strategic_advantage_transfer_body_unknown_field",
    "strategic_mutation_refuses_client_authored_catalog_or_unknown_fields",
  );
  assert.equal(
    input.gateway.transport_calls(),
    transportCallsBeforeBindingRefusal,
  );

  await withOperatorDatabaseCloneV01(
    "r6d-source-proposal-envelope-conflict",
    input.environment,
    async ({ environment, config }) => {
      corruptProposalIdempotencyKeyV01(config, proposalId);
      const envelopeGateway =
        createStrategicAdvantageTransferSmokeGatewayV01();
      const handlers = createVNextOperatorSemanticReviewHandlersV01({
        environment,
        clock: input.clock,
        secret_source: input.secret_source,
        strategic_dependencies: {
          adapter: envelopeGateway.adapter,
          read_model_capability: () => ({
            status: "available",
            summary:
              "Deterministic fake R4 transport is available for envelope refusal coverage.",
            verification: "trusted_local_status",
          }),
          read_cost_budget: () => strategicSmokeCostBudgetV01(config),
          open_gateway_database: () =>
            new Database(config.database_path, { fileMustExist: true }),
          now: () => new Date(input.clock.now()),
        },
      });
      await expectRouteError(
        await handlers.POST(
          routeRequest("/api/vnext/operator/semantic-review", {
            method: "POST",
            jar: cloneRouteCookieJarV01(input.jar),
            body: analysisRequest,
          }),
        ),
        409,
        "strategic_advantage_transfer_source_proposal_material_conflict",
        "strategic_source_proposal_envelope_idempotency_conflict_refused",
      );
      assert.equal(envelopeGateway.transport_calls(), 0);
    },
  );

  await withOperatorDatabaseCloneV01(
    "r6d-model-timeout-settlement",
    input.environment,
    async ({ environment, config }) => {
      let timeoutInvocations = 0;
      let timeoutCapabilityAvailable = true;
      const timeoutHandlers = createVNextOperatorSemanticReviewHandlersV01({
        environment,
        clock: input.clock,
        secret_source: input.secret_source,
        strategic_dependencies: {
          read_model_capability: () => ({
            status: timeoutCapabilityAvailable ? "available" : "unavailable",
            summary: timeoutCapabilityAvailable
              ? "Injected bounded Gateway timeout is available for settlement coverage."
              : "Capability changed after the terminal attempt and must not mask replay settlement.",
            verification: "trusted_local_status" as const,
          }),
          read_cost_budget: () => strategicSmokeCostBudgetV01(config),
          invoke_model: async () => {
            timeoutInvocations += 1;
            throw new ModelGatewayInvocationErrorV01(
              "model_gateway_timeout",
            );
          },
        },
      });
      const timeoutJar = cloneRouteCookieJarV01(input.jar);
      const beforeTimeout = snapshotR6CSemanticAuthorityCounts(config);
      const timeoutResponse = await timeoutHandlers.POST(
        routeRequest("/api/vnext/operator/semantic-review", {
          method: "POST",
          jar: timeoutJar,
          body: analysisRequest,
        }),
      );
      const timeoutBody = await publicJson(timeoutResponse);
      assert.equal(timeoutResponse.status, 200, JSON.stringify(timeoutBody));
      assert.equal(timeoutBody.status, "model_timeout");
      assert.equal(timeoutBody.reason, "model_gateway_timeout");
      assert.equal(timeoutBody.retryable, false);
      assert.equal(timeoutBody.proposal, null);
      assert.equal(timeoutBody.model_invocation_count, 1);
      assert.equal(timeoutInvocations, 1);
      timeoutJar.absorb(timeoutResponse);
      const timeoutReadResponse = await timeoutHandlers.GET(
        routeRequest("/api/vnext/operator/semantic-review", {
          method: "GET",
          jar: timeoutJar,
          query: { proposal_id: proposalId },
        }),
      );
      const timeoutReadBody = await publicJson(timeoutReadResponse);
      assert.equal(timeoutReadResponse.status, 200);
      const timeoutReadback = (
        timeoutReadBody.proposal as VNextOperatorPilotReviewDetailV01
      ).strategic_analysis;
      assert.equal(timeoutReadback.status, "unavailable");
      assert.equal(timeoutReadback.reason, "model_gateway_timeout");
      assert.equal(timeoutReadback.model_attempt_count, 0);
      assert.equal(timeoutReadback.last_model_attempt, null);
      timeoutCapabilityAvailable = false;
      const blockedReplayResponse = await timeoutHandlers.POST(
        routeRequest("/api/vnext/operator/semantic-review", {
          method: "POST",
          jar: timeoutJar,
          body: analysisRequest,
        }),
      );
      const blockedReplayBody = await publicJson(blockedReplayResponse);
      assert.equal(blockedReplayResponse.status, 200);
      assert.equal(blockedReplayBody.status, "model_timeout");
      assert.equal(blockedReplayBody.reason, "model_gateway_timeout");
      assert.equal(blockedReplayBody.retryable, false);
      assert.equal(blockedReplayBody.model_invocation_count, 0);
      assert.equal(timeoutInvocations, 1);
      assert.deepEqual(
        snapshotR6CSemanticAuthorityCounts(config),
        beforeTimeout,
      );
    },
  );
  pass("strategic_gateway_timeout_is_single_attempt_without_partial_proposal");

  await withOperatorDatabaseCloneV01(
    "r6d-provider-failure-receipt",
    input.environment,
    async ({ environment, config }) => {
      const failedGateway =
        createStrategicAdvantageTransferSmokeGatewayV01(
          "transport_failure",
        );
      const handlers = createVNextOperatorSemanticReviewHandlersV01({
        environment,
        clock: input.clock,
        secret_source: input.secret_source,
        strategic_dependencies: {
          adapter: failedGateway.adapter,
          read_model_capability: () => ({
            status: "available",
            summary:
              "Deterministic failing R4 transport is available for attempt-receipt coverage.",
            verification: "trusted_local_status",
          }),
          read_cost_budget: () => strategicSmokeCostBudgetV01(config),
          open_gateway_database: () =>
            new Database(config.database_path, { fileMustExist: true }),
          now: () => new Date(input.clock.now()),
        },
      });
      const jar = cloneRouteCookieJarV01(input.jar);
      const beforeFailure = snapshotR6CSemanticAuthorityCounts(config);
      const response = await handlers.POST(
        routeRequest("/api/vnext/operator/semantic-review", {
          method: "POST",
          jar,
          body: analysisRequest,
        }),
      );
      const body = await publicJson(response);
      assert.equal(response.status, 200, JSON.stringify(body));
      assert.equal(body.status, "model_failed");
      assert.equal(body.reason, "model_gateway_transport_failed");
      assert.equal(body.retryable, false);
      assert.equal(body.model_invocation_count, 1);
      assert.equal(failedGateway.transport_calls(), 1);
      jar.absorb(response);
      assert.deepEqual(
        snapshotR6CSemanticAuthorityCounts(config),
        beforeFailure,
      );
      const readResponse = await handlers.GET(
        routeRequest("/api/vnext/operator/semantic-review", {
          method: "GET",
          jar,
          query: { proposal_id: proposalId },
        }),
      );
      const readBody = await publicJson(readResponse);
      assert.equal(readResponse.status, 200, JSON.stringify(readBody));
      const readback = (
        readBody.proposal as VNextOperatorPilotReviewDetailV01
      ).strategic_analysis;
      assert.equal(readback.status, "unavailable");
      assert.equal(readback.reason, "model_gateway_transport_failed");
      assert.equal(readback.model_attempt_count, 1);
      assert.equal(readback.last_model_attempt?.status, "failed");
      assert.equal(
        readback.last_model_attempt?.failure_code,
        "model_gateway_transport_failed",
      );
      assert.equal(readback.last_model_attempt?.egress_attempted, true);
      const attemptDb = openVNextLocalOperatorDatabaseV01(config);
      try {
        const run = readAutonomyRunLedgerRecord(
          sourceDetail.proposal.source_assessment!.assessment.run_id,
          { db: attemptDb },
        );
        assert(run);
        assert.equal(
          run.metadata.strategic_advantage_transfer_model_attempt_receipt_status,
          "persisted",
        );
        assert.equal(
          typeof run.metadata
            .strategic_advantage_transfer_model_attempt_receipt,
          "object",
        );
        assert.equal(
          typeof run.metadata
            .strategic_advantage_transfer_model_attempt_receipt_fingerprint,
          "string",
        );
        updateAutonomyRunLedgerFields(
          run.run_id,
          {
            metadata: {
              ...run.metadata,
              strategic_advantage_transfer_model_attempt_receipt: null,
              strategic_advantage_transfer_model_attempt_receipt_fingerprint:
                null,
            },
          },
          { db: attemptDb },
        );
      } finally {
        attemptDb.close();
      }
      await expectRouteError(
        await handlers.GET(
          routeRequest("/api/vnext/operator/semantic-review", {
            method: "GET",
            jar,
            query: { proposal_id: proposalId },
          }),
        ),
        409,
        "strategic_advantage_transfer_settlement_conflict",
        "strategic_missing_persisted_attempt_receipt_refused",
      );
      assert.equal(failedGateway.transport_calls(), 1);
    },
  );
  pass("strategic_provider_failure_receipt_is_durable_and_fail_closed");

  await withOperatorDatabaseCloneV01(
    "r6d-local-rejection-completed-receipt",
    input.environment,
    async ({ environment, config }) => {
      const unknownSourceGateway =
        createStrategicAdvantageTransferSmokeGatewayV01("unknown_source");
      const handlers = createVNextOperatorSemanticReviewHandlersV01({
        environment,
        clock: input.clock,
        secret_source: input.secret_source,
        strategic_dependencies: {
          adapter: unknownSourceGateway.adapter,
          read_model_capability: () => ({
            status: "available",
            summary:
              "Deterministic malformed strategic result is available for local rejection receipt coverage.",
            verification: "trusted_local_status",
          }),
          read_cost_budget: () => strategicSmokeCostBudgetV01(config),
          open_gateway_database: () =>
            new Database(config.database_path, { fileMustExist: true }),
          now: () => new Date(input.clock.now()),
        },
      });
      const jar = cloneRouteCookieJarV01(input.jar);
      const beforeFailure = snapshotR6CSemanticAuthorityCounts(config);
      const response = await handlers.POST(
        routeRequest("/api/vnext/operator/semantic-review", {
          method: "POST",
          jar,
          body: analysisRequest,
        }),
      );
      const body = await publicJson(response);
      assert.equal(response.status, 200, JSON.stringify(body));
      assert.equal(body.status, "malformed_output");
      assert.equal(
        body.reason,
        "strategic_advantage_transfer_unknown_source_key",
      );
      assert.equal(body.retryable, false);
      assert.equal(body.model_invocation_count, 1);
      assert.equal(unknownSourceGateway.transport_calls(), 1);
      jar.absorb(response);
      assert.deepEqual(
        snapshotR6CSemanticAuthorityCounts(config),
        beforeFailure,
      );
      const readResponse = await handlers.GET(
        routeRequest("/api/vnext/operator/semantic-review", {
          method: "GET",
          jar,
          query: { proposal_id: proposalId },
        }),
      );
      const readBody = await publicJson(readResponse);
      assert.equal(readResponse.status, 200, JSON.stringify(readBody));
      const readback = (
        readBody.proposal as VNextOperatorPilotReviewDetailV01
      ).strategic_analysis;
      assert.equal(readback.status, "unavailable");
      assert.equal(
        readback.reason,
        "strategic_advantage_transfer_unknown_source_key",
      );
      assert.equal(readback.model_attempt_count, 1);
      assert.equal(readback.last_model_attempt?.status, "completed");
      assert.equal(readback.last_model_attempt?.failure_code, null);
      assert.equal(readback.last_model_attempt?.egress_attempted, true);
      const replayResponse = await handlers.POST(
        routeRequest("/api/vnext/operator/semantic-review", {
          method: "POST",
          jar,
          body: analysisRequest,
        }),
      );
      const replayBody = await publicJson(replayResponse);
      assert.equal(replayResponse.status, 200, JSON.stringify(replayBody));
      assert.equal(replayBody.status, "malformed_output");
      assert.equal(
        replayBody.reason,
        "strategic_advantage_transfer_unknown_source_key",
      );
      assert.equal(replayBody.retryable, false);
      assert.equal(replayBody.model_invocation_count, 0);
      assert.equal(unknownSourceGateway.transport_calls(), 1);
      jar.absorb(replayResponse);
      const attemptDb = openVNextLocalOperatorDatabaseV01(config);
      try {
        const run = readAutonomyRunLedgerRecord(
          sourceDetail.proposal.source_assessment!.assessment.run_id,
          { db: attemptDb },
        );
        assert(run);
        assert.equal(
          run.metadata.strategic_advantage_transfer_model_attempt_receipt_status,
          "persisted",
        );
        const receipt = run.metadata
          .strategic_advantage_transfer_model_attempt_receipt as {
          status?: string;
          normalized_output_fingerprint?: string;
        };
        assert.equal(receipt.status, "completed");
        assert.match(
          String(receipt.normalized_output_fingerprint),
          /^sha256:[0-9a-f]{64}$/,
        );
      } finally {
        attemptDb.close();
      }
    },
  );
  pass("strategic_local_rejection_preserves_completed_gateway_receipt");

  await withOperatorDatabaseCloneV01(
    "r6d-proposal-writer-failure",
    input.environment,
    async ({ environment, config }) => {
      const failureGateway = createStrategicAdvantageTransferSmokeGatewayV01();
      let injectProposalWriterFailure = true;
      const failureHandlers = createVNextOperatorSemanticReviewHandlersV01({
        environment,
        clock: input.clock,
        secret_source: input.secret_source,
        strategic_dependencies: {
          adapter: failureGateway.adapter,
          read_model_capability: () => ({
            status: "available",
            summary:
              "Deterministic fake R4 transport is available for proposal rollback coverage.",
            verification: "trusted_local_status",
          }),
          read_cost_budget: () => strategicSmokeCostBudgetV01(config),
          open_gateway_database: () =>
            new Database(config.database_path, { fileMustExist: true }),
          now: () => new Date(input.clock.now()),
          before_proposal_insert: () => {
            if (!injectProposalWriterFailure) return;
            injectProposalWriterFailure = false;
            throw Object.assign(
              new Error("injected strategic proposal writer failure"),
              { code: "SQLITE_BUSY" },
            );
          },
        },
      });
      const failureJar = cloneRouteCookieJarV01(input.jar);
      const beforeFailure = snapshotR6CSemanticAuthorityCounts(config);
      const sourceFailureDb = openVNextLocalOperatorDatabaseV01(config);
      const sourceFailureBefore = (() => {
        try {
          const record = readVNextCoreRecordV01(sourceFailureDb, {
            record_kind: "episode_delta_proposal",
            record_id: proposalId,
            workspace_id: config.workspace_id,
            project_id: config.project_id,
          });
          assert(record);
          return canonicalizeProtocolValueV01(record.payload);
        } finally {
          sourceFailureDb.close();
        }
      })();
      const response = await failureHandlers.POST(
        routeRequest("/api/vnext/operator/semantic-review", {
          method: "POST",
          jar: failureJar,
          body: analysisRequest,
        }),
      );
      const body = await publicJson(response);
      assert.equal(response.status, 200, JSON.stringify(body));
      assert.equal(
        body.status,
        "proposal_admission_failed",
        JSON.stringify(body),
      );
      assert.equal(body.reason, "SQLITE_BUSY");
      assert.equal(body.retryable, true);
      assert.equal(body.proposal, null);
      assert.equal(body.model_invocation_count, 1);
      assert.equal(body.source_proposal_unchanged, true);
      assert.equal(body.transition_applied, false);
      assert.equal(failureGateway.transport_calls(), 1);
      failureJar.absorb(response);
      assert.deepEqual(
        snapshotR6CSemanticAuthorityCounts(config),
        beforeFailure,
      );
      const sourceFailureAfterDb = openVNextLocalOperatorDatabaseV01(config);
      try {
        const sourceFailureAfter = readVNextCoreRecordV01(
          sourceFailureAfterDb,
          {
            record_kind: "episode_delta_proposal",
            record_id: proposalId,
            workspace_id: config.workspace_id,
            project_id: config.project_id,
          },
        );
        assert(sourceFailureAfter);
        assert.equal(
          canonicalizeProtocolValueV01(sourceFailureAfter.payload),
          sourceFailureBefore,
        );
        const failedRun = readAutonomyRunLedgerRecord(
          sourceDetail.proposal.source_assessment!.assessment.run_id,
          { db: sourceFailureAfterDb },
        );
        assert(failedRun);
        assert.equal(
          failedRun.metadata.strategic_advantage_transfer_status,
          "failed",
        );
        assert.equal(
          failedRun.metadata.strategic_advantage_transfer_retry_required,
          true,
        );
        assert.equal(
          typeof failedRun.metadata
            .strategic_advantage_transfer_normalized_model_output,
          "object",
        );
        assert.equal(
          typeof failedRun.metadata
            .strategic_advantage_transfer_model_invocation_receipt,
          "object",
        );
      } finally {
        sourceFailureAfterDb.close();
      }
      const failedReadResponse = await failureHandlers.GET(
        routeRequest("/api/vnext/operator/semantic-review", {
          method: "GET",
          jar: failureJar,
          query: { proposal_id: proposalId },
        }),
      );
      const failedReadBody = await publicJson(failedReadResponse);
      assert.equal(failedReadResponse.status, 200, JSON.stringify(failedReadBody));
      assert.equal(
        (
          failedReadBody.proposal as {
            strategic_analysis: { status: string; reason: string | null };
          }
        ).strategic_analysis.status,
        "eligible",
      );
      assert.equal(
        (
          failedReadBody.proposal as {
            strategic_analysis: {
              status: string;
              reason: string | null;
              model_invocation_required: boolean;
            };
          }
        ).strategic_analysis.reason,
        "SQLITE_BUSY",
      );
      assert.equal(
        (
          failedReadBody.proposal as {
            strategic_analysis: { model_invocation_required: boolean };
          }
        ).strategic_analysis.model_invocation_required,
        false,
      );
      const reconciliationHandlers =
        createVNextOperatorSemanticReviewHandlersV01({
          environment,
          clock: input.clock,
          secret_source: input.secret_source,
          strategic_dependencies: {
            read_model_capability: () => ({
              status: "unavailable",
              summary:
                "No current model capability is needed to reconcile the exact settled normalized result.",
              verification: "trusted_local_status",
            }),
            read_cost_budget: () => strategicSmokeCostBudgetV01(config),
            invoke_model: async () => {
              throw new Error(
                "cached strategic reconciliation must not invoke the Model Gateway",
              );
            },
          },
        });
      const unavailableCapabilityReadResponse =
        await reconciliationHandlers.GET(
          routeRequest("/api/vnext/operator/semantic-review", {
            method: "GET",
            jar: failureJar,
            query: { proposal_id: proposalId },
          }),
        );
      const unavailableCapabilityReadBody = await publicJson(
        unavailableCapabilityReadResponse,
      );
      assert.equal(unavailableCapabilityReadResponse.status, 200);
      assert.equal(
        (
          unavailableCapabilityReadBody.proposal as {
            strategic_analysis: {
              status: string;
              model_invocation_required: boolean;
              model_capability: { status: string };
            };
          }
        ).strategic_analysis.status,
        "eligible",
      );
      assert.equal(
        (
          unavailableCapabilityReadBody.proposal as {
            strategic_analysis: {
              model_invocation_required: boolean;
              model_capability: { status: string };
            };
          }
        ).strategic_analysis.model_invocation_required,
        false,
      );
      assert.equal(
        (
          unavailableCapabilityReadBody.proposal as {
            strategic_analysis: {
              model_capability: { status: string };
            };
          }
        ).strategic_analysis.model_capability.status,
        "unavailable",
      );
      const retryResponse = await reconciliationHandlers.POST(
        routeRequest("/api/vnext/operator/semantic-review", {
          method: "POST",
          jar: failureJar,
          body: analysisRequest,
        }),
      );
      const retryBody = await publicJson(retryResponse);
      assert.equal(retryResponse.status, 201, JSON.stringify(retryBody));
      assert.equal(retryBody.status, "inserted");
      assert(retryBody.proposal);
      assert.equal(retryBody.model_invocation_count, 0);
      assert.equal(failureGateway.transport_calls(), 1);
      const afterRetry = snapshotR6CSemanticAuthorityCounts(config);
      assert.equal(afterRetry.proposals, beforeFailure.proposals + 1);
      assert.equal(afterRetry.decisions, beforeFailure.decisions);
      assert.equal(afterRetry.transitions, beforeFailure.transitions);
      assert.equal(afterRetry.packets, beforeFailure.packets);
      const settledDb = openVNextLocalOperatorDatabaseV01(config);
      try {
        const settledRun = readAutonomyRunLedgerRecord(
          sourceDetail.proposal.source_assessment!.assessment.run_id,
          { db: settledDb },
        );
        assert(settledRun);
        assert.equal(
          settledRun.metadata.strategic_advantage_transfer_status,
          "available",
        );
        assert.equal(
          settledRun.metadata
            .strategic_advantage_transfer_normalized_model_output,
          null,
        );
        assert.equal(
          settledRun.metadata
            .strategic_advantage_transfer_model_invocation_receipt,
          null,
        );
      } finally {
        settledDb.close();
      }
    },
  );
  pass(
    "strategic_retryable_writer_failure_replays_durable_normalized_result_without_reinvocation_or_partial_record",
  );

  await withOperatorDatabaseCloneV01(
    "r6d-concurrent-duplicate-request",
    input.environment,
    async ({ environment, config }) => {
      const concurrentGateway =
        createStrategicAdvantageTransferSmokeGatewayV01();
      const concurrentHandlers = createVNextOperatorSemanticReviewHandlersV01({
        environment,
        clock: input.clock,
        secret_source: input.secret_source,
        strategic_dependencies: {
          adapter: concurrentGateway.adapter,
          read_model_capability: () => ({
            status: "available",
            summary:
              "Deterministic fake R4 transport is available for concurrent request coverage.",
            verification: "trusted_local_status",
          }),
          read_cost_budget: () => strategicSmokeCostBudgetV01(config),
          open_gateway_database: () =>
            new Database(config.database_path, { fileMustExist: true }),
          now: () => new Date(input.clock.now()),
        },
      });
      const concurrentSessionHandlers =
        createVNextLocalOperatorSessionHandlersV01({
          environment,
          clock: input.clock,
          secret_source: input.secret_source,
        });
      const secondBootstrap = issueBootstrap(
        environment,
        input.clock,
        input.secret_source,
      );
      rememberCredentialMaterial(secondBootstrap.bootstrap_token);
      const secondExchange = await bootstrapThroughRoute(
        concurrentSessionHandlers,
        secondBootstrap.bootstrap_token,
      );
      assert.equal(secondExchange.response.status, 200);
      const firstJar = cloneRouteCookieJarV01(input.jar);
      const secondJar = new RouteCookieJar();
      secondJar.setPair(secondExchange.cookiePair);
      const beforeConcurrent = snapshotR6CSemanticAuthorityCounts(config);
      const responses = await Promise.all(
        [firstJar, secondJar].map((jar) =>
          concurrentHandlers.POST(
            routeRequest("/api/vnext/operator/semantic-review", {
              method: "POST",
              jar,
              body: analysisRequest,
            }),
          ),
        ),
      );
      const bodies = await Promise.all(
        responses.map((response) => publicJson(response)),
      );
      assert.deepEqual(
        responses.map((response) => response.status).sort(),
        [200, 201],
      );
      assert.deepEqual(bodies.map((body) => body.status).sort(), [
        "exact_replay",
        "inserted",
      ]);
      const proposalIds = new Set(
        bodies.map((body) =>
          String((body.proposal as EpisodeDeltaProposalV01).proposal_id),
        ),
      );
      assert.equal(proposalIds.size, 1);
      assert.equal(concurrentGateway.transport_calls(), 1);
      assert.deepEqual(snapshotR6CSemanticAuthorityCounts(config), {
        ...beforeConcurrent,
        proposals: beforeConcurrent.proposals + 1,
      });
    },
  );
  pass(
    "strategic_concurrent_duplicate_requests_share_one_gateway_call_and_proposal",
  );

  const unavailableResponse = await unavailableHandlers.POST(
    routeRequest("/api/vnext/operator/semantic-review", {
      method: "POST",
      jar: input.jar,
      body: analysisRequest,
    }),
  );
  const unavailableBody = await publicJson(unavailableResponse);
  assert.equal(
    unavailableResponse.status,
    200,
    JSON.stringify(unavailableBody),
  );
  assert.equal(unavailableBody.status, "unavailable");
  assert.equal(unavailableBody.proposal, null);
  assert.equal(unavailableBody.model_invocation_count, 0);
  assert.equal(unavailableBody.source_proposal_unchanged, true);
  assert.equal(input.gateway.transport_calls(), 0);
  assert.deepEqual(
    snapshotR6CSemanticAuthorityCounts(input.config),
    beforeReads,
  );
  pass("strategic_model_unavailable_preserves_zero_model_review_path");

  input.clock.set("2026-07-11T09:21:30.000Z");
  assert.deepEqual(Object.keys(analysisRequest).sort(), [
    "action",
    "proposal_fingerprint",
    "proposal_id",
  ]);
  const insertedResponse = await input.review_handlers.POST(
    routeRequest("/api/vnext/operator/semantic-review", {
      method: "POST",
      jar: input.jar,
      body: analysisRequest,
    }),
  );
  const insertedBody = await publicJson(insertedResponse);
  assert.equal(insertedResponse.status, 201, JSON.stringify(insertedBody));
  assert.equal(insertedBody.status, "inserted");
  assert.equal(insertedBody.model_invocation_count, 1);
  assert.equal(insertedBody.source_proposal_unchanged, true);
  assert.equal(insertedBody.transition_applied, false);
  input.jar.absorb(insertedResponse);
  assert.equal(input.gateway.transport_calls(), 1);
  assert.equal(input.gateway.requests().length, 1);
  assert.equal(
    input.gateway.requests()[0]!.url.includes("api.openai.com"),
    true,
  );
  assert.equal(
    input.gateway.requests()[0]!.body.includes(operatorProjectRoot),
    false,
  );
  assert.equal(
    input.gateway.requests()[0]!.body.includes("server_adverse_context"),
    true,
  );
  pass("strategic_explicit_action_invokes_one_r4_call_and_admits_proposal");
  const strategicProposal = insertedBody.proposal as EpisodeDeltaProposalV01;
  assert.equal(strategicProposal.status, "pending_review");
  assert.equal(strategicProposal.source_assessment, undefined);
  assert.equal(strategicProposal.operation_revision, undefined);
  const profile = strategicProposal.strategic_advantage_transfer;
  assert(profile);
  assert.equal(profile.profile_version, "strategic_advantage_transfer.v0.1");
  assert.equal(profile.source_proposal.proposal_id, proposalId);
  assert.equal(profile.base_strategy.delta_type, "agent_plan_delta");
  assert.equal(profile.base_strategy.currentness, "fresh");
  assert.equal(profile.lenses.length, 3);
  assert.equal(profile.transfer_items.length, 1);
  assert.equal(
    profile.model_invocation.receipt.purpose,
    "strategic_advantage_transfer",
  );
  assert.equal(profile.model_invocation.receipt.execution_mode, "live");
  assert.equal(profile.model_invocation.receipt.egress_attempted, true);
  assert.equal(profile.model_invocation.receipt.status, "completed");
  assert.equal(profile.budget.model.cost.status, "available");
  if (profile.budget.model.cost.status !== "available") {
    throw new Error("strategic_cost_budget_missing");
  }
  const strategicCostBudget = profile.budget.model.cost.budget;
  assert.equal(
    profile.budget.model.cost.budget.maximum_permitted_cost,
    98_304,
  );
  assert.equal(
    profile.budget.model.cost.budget.calculated_worst_case_cost,
    98_304,
  );
  assert.equal(
    profile.budget.model.cost.budget.authority.cost_unit,
    "operator_pilot_test_credit_microunit",
  );
  assert.deepEqual(
    profile.model_invocation.receipt.budget.cost_budget,
    profile.budget.model.cost.budget,
  );
  assert.equal(
    profile.model_invocation.receipt.cost.source,
    "provider_cost_not_reported",
  );
  const strategicSettlementDb = openVNextLocalOperatorDatabaseV01(input.config);
  try {
    const run = readAutonomyRunLedgerRecord(profile.assessment.run_id, {
      db: strategicSettlementDb,
    });
    assert(run);
    assert.equal(
      run.metadata.strategic_advantage_transfer_status,
      "available",
    );
    assert.equal(
      run.metadata.strategic_advantage_transfer_analysis_identity,
      profile.analysis_identity,
    );
    assert.equal(
      run.metadata.strategic_advantage_transfer_proposal_id,
      strategicProposal.proposal_id,
    );
    assert.equal(
      run.metadata.strategic_advantage_transfer_proposal_fingerprint,
      strategicProposal.integrity.fingerprint,
    );
    assert.equal(
      run.metadata.strategic_advantage_transfer_model_invocation_receipt_fingerprint,
      profile.model_invocation.receipt_fingerprint,
    );
    assert.equal(
      run.metadata.strategic_advantage_transfer_normalized_output_fingerprint,
      profile.model_invocation.normalized_output_fingerprint,
    );
    assert.equal(
      run.metadata.strategic_advantage_transfer_retry_required,
      false,
    );
    assert.equal(
      run.metadata.strategic_advantage_transfer_normalized_model_output,
      null,
    );
    assert.equal(
      run.metadata.strategic_advantage_transfer_model_invocation_receipt,
      null,
    );
  } finally {
    strategicSettlementDb.close();
  }
  assert.equal(profile.authority.authoritative, false);
  assert.equal(profile.authority.creates_decision, false);
  assert.equal(profile.authority.applies_transition, false);
  assert.equal(profile.authority.changes_semantic_state, false);
  assert.equal(profile.authority.changes_later_context, false);
  assert.equal(strategicProposal.proposed_deltas.length, 1);
  assert.equal(strategicProposal.proposed_deltas[0]!.operation, "unknown");
  assert.equal(
    strategicProposal.proposed_deltas[0]!.delta_type,
    "research_delta",
  );
  assert.equal(profile.transfer_items[0]!.support.status, "unknown");
  assert.equal(profile.transfer_items[0]!.support.basis, "insufficient");
  assert.deepEqual(
    profile.server_adverse_context,
    profile.working_frame.server_adverse_context,
  );
  assert.equal(
    profile.transfer_items[0]!.support.server_adverse_context_fingerprint,
    profile.server_adverse_context.adverse_context_fingerprint,
  );
  assert.ok(profile.server_adverse_context.items.length > 0);
  assert.ok(
    profile.server_adverse_context.items.some(
      (item) => item.category === "unknown_criterion",
    ),
  );
  assert.ok(
    profile.server_adverse_context.items.some(
      (item) => item.category === "insufficient_criterion",
    ),
  );
  assert.ok(
    profile.server_adverse_context.items.some(
      (item) => item.source_refs.length === 0,
    ),
    "source-less task-wide residue must remain typed and fingerprinted",
  );
  assert.equal(
    profile.transfer_items[0]!.selected_support_entries.length,
    profile.transfer_items[0]!.source_keys.length,
  );
  const durableStrategicMaterial = JSON.stringify(strategicProposal);
  for (const forbidden of [
    "operator-pilot-strategic-fixture-credential",
    "/tmp/private/result.txt",
    operatorProjectRoot,
  ]) {
    assert.equal(durableStrategicMaterial.includes(forbidden), false);
  }
  const forgedSettledProposal = structuredClone(strategicProposal);
  const forgedProfile = forgedSettledProposal.strategic_advantage_transfer;
  assert(forgedProfile);
  const forgedLensResult =
    forgedProfile.normalized_model_output.lens_results.find(
      (result) => result.result === "transfer",
    );
  assert(forgedLensResult?.result === "transfer");
  forgedLensResult.expected_effect =
    "A recomputed proposal identity cannot replace the exact ModelInvocationReceipt-bound normalized result.";
  forgedSettledProposal.proposal_id = deriveEpisodeDeltaProposalIdV01(
    forgedSettledProposal,
  );
  forgedSettledProposal.integrity.fingerprint =
    createEpisodeDeltaProposalFingerprintV01(forgedSettledProposal);
  const forgedReadbackDb = openVNextLocalOperatorDatabaseV01(input.config);
  try {
    assert.throws(
      () =>
        readVNextOperatorStrategicAdvantageTransferV01(forgedReadbackDb, {
          config: input.config,
          proposal: forgedSettledProposal,
          cost_budget: strategicCostBudget,
          model_capability: {
            status: "available",
            summary: "Deterministic fake R4 transport remains available.",
            verification: "trusted_local_status",
          },
        }),
      /strategic_advantage_transfer_model_output_receipt_conflict/,
    );
  } finally {
    forgedReadbackDb.close();
  }
  pass(
    "strategic_recomputed_proposal_identity_cannot_bypass_model_receipt_binding",
  );
  await withOperatorDatabaseCloneV01(
    "r6d-strategic-proposal-envelope-conflict",
    input.environment,
    async ({ environment, config }) => {
      corruptProposalIdempotencyKeyV01(
        config,
        strategicProposal.proposal_id,
      );
      const handlers = createVNextOperatorSemanticReviewHandlersV01({
        environment,
        clock: input.clock,
        secret_source: input.secret_source,
        strategic_dependencies: {
          read_model_capability: () => ({
            status: "available",
            summary:
              "Deterministic fake R4 transport is available for envelope refusal coverage.",
            verification: "trusted_local_status",
          }),
          read_cost_budget: () => strategicSmokeCostBudgetV01(config),
        },
      });
      await expectRouteError(
        await handlers.GET(
          routeRequest("/api/vnext/operator/semantic-review", {
            method: "GET",
            jar: cloneRouteCookieJarV01(input.jar),
            query: { proposal_id: strategicProposal.proposal_id },
          }),
        ),
        422,
        "operator_pilot_proposal_envelope_mismatch",
        "strategic_proposal_envelope_idempotency_conflict_refused",
      );
    },
  );
  for (const conflict of [
    {
      label: "source proposal fingerprint",
      mutate(proposal: EpisodeDeltaProposalV01): void {
        const strategic = proposal.strategic_advantage_transfer;
        assert(strategic);
        strategic.source_proposal.proposal_fingerprint = `sha256:${"1".repeat(64)}`;
      },
    },
    {
      label: "source candidate fingerprint",
      mutate(proposal: EpisodeDeltaProposalV01): void {
        const strategic = proposal.strategic_advantage_transfer;
        assert(strategic);
        assert(strategic.source_proposal.candidate_bindings[0]);
        strategic.source_proposal.candidate_bindings[0]!.candidate_fingerprint = `sha256:${"2".repeat(64)}`;
      },
    },
  ] as const) {
    const forged = structuredClone(strategicProposal);
    conflict.mutate(forged);
    forged.proposal_id = deriveEpisodeDeltaProposalIdV01(forged);
    forged.integrity.fingerprint =
      createEpisodeDeltaProposalFingerprintV01(forged);
    const conflictDb = openVNextLocalOperatorDatabaseV01(input.config);
    try {
      assert.throws(
        () =>
          readVNextOperatorStrategicAdvantageTransferV01(conflictDb, {
            config: input.config,
            proposal: forged,
            cost_budget: strategicCostBudget,
            model_capability: {
              status: "available",
              summary: "Deterministic fake R4 transport remains available.",
              verification: "trusted_local_status",
            },
          }),
        /strategic_advantage_transfer_material_conflict/,
        `${conflict.label} must remain exact-bound after identity recomputation`,
      );
    } finally {
      conflictDb.close();
    }
  }
  pass("strategic_source_proposal_and_candidate_conflicts_fail_closed");

  const sourceLessAdverseItem = profile.server_adverse_context.items.find(
    (item) => item.source_refs.length === 0,
  );
  assert(sourceLessAdverseItem);
  const forgedWithoutAdverseContext = structuredClone(strategicProposal);
  const forgedWithoutAdverseProfile =
    forgedWithoutAdverseContext.strategic_advantage_transfer;
  assert(forgedWithoutAdverseProfile);
  forgedWithoutAdverseProfile.server_adverse_context =
    createStrategicAdvantageTransferAdverseContextV01(
      forgedWithoutAdverseProfile.server_adverse_context.items.filter(
        (item) => item.code !== sourceLessAdverseItem.code,
      ),
    );
  forgedWithoutAdverseContext.proposal_id = deriveEpisodeDeltaProposalIdV01(
    forgedWithoutAdverseContext,
  );
  forgedWithoutAdverseContext.integrity.fingerprint =
    createEpisodeDeltaProposalFingerprintV01(forgedWithoutAdverseContext);
  const adverseConflictDb = openVNextLocalOperatorDatabaseV01(input.config);
  try {
    assert.throws(
      () =>
        readVNextOperatorStrategicAdvantageTransferV01(adverseConflictDb, {
          config: input.config,
          proposal: forgedWithoutAdverseContext,
          cost_budget: strategicCostBudget,
          model_capability: {
            status: "available",
            summary: "Deterministic fake R4 transport remains available.",
            verification: "trusted_local_status",
          },
        }),
      /strategic_advantage_transfer_material_conflict/,
      "recomputed proposal identity must not hide removed server adverse context",
    );
  } finally {
    adverseConflictDb.close();
  }
  pass("strategic_adverse_context_removal_fails_closed_after_recomputed_identity");

  const crossProjectDb = openVNextLocalOperatorDatabaseV01(input.config);
  try {
    const crossProjectReadback = readVNextOperatorStrategicAdvantageTransferV01(
      crossProjectDb,
      {
        config: {
          ...input.config,
          project_id: FOREIGN_PROJECT_ID,
        },
        proposal: strategicProposal,
        cost_budget: strategicCostBudget,
        model_capability: {
          status: "available",
          summary: "Deterministic fake R4 transport remains available.",
          verification: "trusted_local_status",
        },
      },
    );
    assert.equal(crossProjectReadback.status, "stale");
    assert.equal(crossProjectReadback.reason, "source_proposal_missing");
  } finally {
    crossProjectDb.close();
  }
  pass("strategic_cross_project_readback_refuses_source_lineage");

  await withOperatorDatabaseCloneV01(
    "r6d-stale-agent-plan-head",
    input.environment,
    async ({ config }) => {
      const staleDb = openVNextLocalOperatorDatabaseV01(config);
      try {
        const changed = staleDb
          .prepare(
            `UPDATE vnext_semantic_target_heads
             SET revision = revision + 1,
                 updated_at = ?
             WHERE workspace_id = ? AND project_id = ? AND target_key = ?`,
          )
          .run(
            "2026-07-11T09:21:31.000Z",
            config.workspace_id,
            config.project_id,
            profile.base_strategy.target_key,
          );
        assert.equal(changed.changes, 1);
        const staleReadback = readVNextOperatorStrategicAdvantageTransferV01(
          staleDb,
          {
            config,
            proposal: strategicProposal,
            cost_budget: strategicCostBudget,
            model_capability: {
              status: "available",
              summary: "Deterministic fake R4 transport remains available.",
              verification: "trusted_local_status",
            },
          },
        );
        assert.equal(staleReadback.status, "stale");
        assert.equal(
          staleReadback.reason,
          "strategic_advantage_transfer_base_strategy_stale",
        );
      } finally {
        staleDb.close();
      }
    },
  );
  pass("strategic_stale_accepted_agent_plan_head_blocks_readback");

  const strategicCandidate = strategicProposal.proposed_deltas[0]!;
  const compatibleStrategicRevision =
    evaluateVNextOperatorPilotRevisionDeltaTargetCompatibilityV01({
      source_proposal: strategicProposal,
      source_candidate: strategicCandidate,
      revised_delta_type: "agent_plan_delta",
      revised_target_refs: strategicCandidate.target_refs,
    });
  assert.equal(compatibleStrategicRevision.status, "compatible");
  assert.equal(compatibleStrategicRevision.policy, "strategic_agent_plan_lane");
  for (const incompatibleDeltaType of [
    "research_delta",
    "validation_delta",
    "memory_delta",
    "perspective_delta",
    "artifact_delta",
    "code_delta",
    "world_state_delta",
    "user_decision_delta",
    "coordination_delta",
  ] as const) {
    const incompatible =
      evaluateVNextOperatorPilotRevisionDeltaTargetCompatibilityV01({
        source_proposal: strategicProposal,
        source_candidate: strategicCandidate,
        revised_delta_type: incompatibleDeltaType,
        revised_target_refs: strategicCandidate.target_refs,
      });
    assert.equal(incompatible.status, "incompatible");
    assert.equal(
      incompatible.code,
      "operator_pilot_revision_delta_target_incompatible",
    );
  }
  pass("strategic_transfer_revision_lane_is_exact_and_server_owned");

  await withOperatorDatabaseCloneV01(
    "r6d-strategic-revision-readback",
    input.environment,
    async ({ environment, config }) => {
      const handlers = createVNextOperatorSemanticReviewHandlersV01({
        environment,
        clock: input.clock,
        secret_source: input.secret_source,
        strategic_dependencies: {
          read_model_capability: () => ({
            status: "available",
            summary:
              "Deterministic fake R4 transport remains available for immutable revision readback coverage.",
            verification: "trusted_local_status",
          }),
          read_cost_budget: () => strategicSmokeCostBudgetV01(config),
        },
      });
      const jar = cloneRouteCookieJarV01(input.jar);
      const beforeRevision = snapshotR6CSemanticAuthorityCounts(config);
      const sourceResponse = await handlers.GET(
        routeRequest("/api/vnext/operator/semantic-review", {
          method: "GET",
          jar,
          query: { proposal_id: strategicProposal.proposal_id },
        }),
      );
      const sourceBody = await publicJson(sourceResponse);
      assert.equal(sourceResponse.status, 200, JSON.stringify(sourceBody));
      const sourceRead =
        sourceBody.proposal as VNextOperatorPilotReviewDetailV01;
      const candidateRead = sourceRead.candidates.find(
        (entry) =>
          entry.candidate.candidate_id === strategicCandidate.candidate_id,
      );
      assert(candidateRead);
      const request = {
        action: "revise" as const,
        proposal_id: strategicProposal.proposal_id,
        proposal_fingerprint: strategicProposal.integrity.fingerprint,
        candidate_id: candidateRead.candidate.candidate_id,
        candidate_fingerprint: candidateRead.candidate_fingerprint,
        delta_type: "agent_plan_delta" as const,
        operation: "revise" as const,
        title: "Review one bounded local plan revision",
        proposed_state_summary:
          "Preserve the exact accepted plan target while separately reviewing this source-bound local transfer.",
        rationale_summary:
          "A human-authored immutable revision selects the exact existing agent-plan lane and target.",
        uncertainties: [
          "The underlying criterion assessment remains unknown and insufficient.",
        ],
        limitations: [
          "The immutable revision remains pending and grants no Transition authority.",
        ],
      };
      const revisionResponse = await handlers.POST(
        routeRequest("/api/vnext/operator/semantic-review", {
          method: "POST",
          jar,
          body: request,
        }),
      );
      const revisionBody = await publicJson(revisionResponse);
      assert.equal(revisionResponse.status, 201, JSON.stringify(revisionBody));
      jar.absorb(revisionResponse);
      const revision = revisionBody.proposal as EpisodeDeltaProposalV01;
      assert.equal(revision.operation_revision?.selected_delta_type, "agent_plan_delta");
      assert.equal(revision.operation_revision?.selected_operation, "revise");
      assert.equal(
        canonicalizeProtocolValueV01(revision.strategic_advantage_transfer),
        canonicalizeProtocolValueV01(profile),
      );
      const revisionReadResponse = await handlers.GET(
        routeRequest("/api/vnext/operator/semantic-review", {
          method: "GET",
          jar,
          query: { proposal_id: revision.proposal_id },
        }),
      );
      const revisionReadBody = await publicJson(revisionReadResponse);
      assert.equal(
        revisionReadResponse.status,
        200,
        JSON.stringify(revisionReadBody),
      );
      const revisionRead =
        revisionReadBody.proposal as VNextOperatorPilotReviewDetailV01;
      assert.equal(revisionRead.proposal_id, revision.proposal_id);
      assert.equal(revisionRead.strategic_analysis.status, "available");
      const replayResponse = await handlers.POST(
        routeRequest("/api/vnext/operator/semantic-review", {
          method: "POST",
          jar,
          body: request,
        }),
      );
      const replayBody = await publicJson(replayResponse);
      assert.equal(replayResponse.status, 200, JSON.stringify(replayBody));
      assert.equal(replayBody.status, "exact_replay");
      assert.equal(
        (replayBody.proposal as EpisodeDeltaProposalV01).proposal_id,
        revision.proposal_id,
      );
      const afterRevision = snapshotR6CSemanticAuthorityCounts(config);
      assert.equal(afterRevision.proposals, beforeRevision.proposals + 1);
      assert.equal(afterRevision.decisions, beforeRevision.decisions);
      assert.equal(afterRevision.transitions, beforeRevision.transitions);
      assert.equal(afterRevision.packets, beforeRevision.packets);
    },
  );
  pass("strategic_operation_revision_reopens_and_replays_exactly");

  const sourceBindingDb = openVNextLocalOperatorDatabaseV01(input.config);
  const sourceBinding = (() => {
    try {
      return readProjectRunResultSourceBindingV01(sourceBindingDb, {
        workspace_id: input.config.workspace_id,
        project_id: input.config.project_id,
        receipt_id: profile.receipt_ref.external_id,
      });
    } finally {
      sourceBindingDb.close();
    }
  })();
  assert(sourceBinding.packet);
  assert.equal(sourceBinding.criterion_assessment.status, "available");
  if (sourceBinding.criterion_assessment.status !== "available") {
    throw new Error("r6_d_no_transfer_assessment_unavailable");
  }
  const noTransferOutput = {
    schema_version: "strategic_advantage_transfer_model_output.v0.1" as const,
    lens_results: profile.lenses.map((lensId) => ({
      result: "no_transfer" as const,
      lens_id: lensId,
      non_transfer_reason: `The exact bounded ${lensId} sources support no local transfer.`,
    })),
    stop_reason: "no_transferable_advantage" as const,
  };
  const noTransferInput = {
    source_proposal: sourceDetail.proposal,
    packet: sourceBinding.packet,
    receipt: sourceBinding.receipt,
    assessment: sourceBinding.criterion_assessment.assessment,
    base_strategy: profile.base_strategy,
    working_frame: profile.working_frame,
    source_catalog: profile.source_catalog,
    budget: profile.budget,
    model_output: noTransferOutput,
    model_invocation_receipt: profile.model_invocation.receipt,
  };
  assert.throws(
    () =>
      materializeStrategicAdvantageTransferProposalV01(
        structuredClone(noTransferInput),
      ),
    /strategic_advantage_transfer_model_output_receipt_conflict/,
  );
  pass("strategic_changed_output_under_same_gateway_receipt_fails_closed");
  const afterInsert = snapshotR6CSemanticAuthorityCounts(input.config);
  assert.deepEqual(afterInsert, {
    ...beforeReads,
    proposals: beforeReads.proposals + 1,
  });
  pass("strategic_model_receipt_and_pending_proposal_admitted_once");

  const directReviewDb = openVNextLocalOperatorDatabaseV01(input.config);
  try {
    const directDetail = readVNextOperatorPilotSemanticReviewV01(
      directReviewDb,
      {
        config: input.config,
        proposal_id: strategicProposal.proposal_id,
        authenticated_session_id: null,
        model_capability: {
          status: "available",
          summary: "Deterministic fake R4 transport remains available.",
          verification: "trusted_local_status",
        },
      },
    );
    assert.equal(directDetail.proposal_id, strategicProposal.proposal_id);
    const directLineage = readVNextOperatorPilotProposalDurableLineageV01(
      directReviewDb,
      {
        config: input.config,
        proposal: directDetail.proposal,
        clock: input.clock,
      },
    );
    assert.equal(directLineage.overall_status, "not_applied");
    projectVNextOperatorPilotContinuityV01(directReviewDb, {
      config: input.config,
      clock: input.clock,
    });
  } finally {
    directReviewDb.close();
  }
  const detailResponse = await input.review_handlers.GET(
    routeRequest("/api/vnext/operator/semantic-review", {
      method: "GET",
      jar: input.jar,
      query: { proposal_id: strategicProposal.proposal_id },
    }),
  );
  const detailBody = await publicJson(detailResponse);
  assert.equal(detailResponse.status, 200, JSON.stringify(detailBody));
  const detail = detailBody.proposal as VNextOperatorPilotReviewDetailV01 & {
    strategic_analysis: { status: string };
  };
  assert.equal(detail.status, "pending_review");
  assert.equal(detail.decision_count, 0);
  assert.equal(detail.transition.status, "not_applied");
  assert.equal(detail.strategic_analysis.status, "available");
  assert.equal(
    detail.candidates.every(
      (entry) =>
        entry.candidate.operation === "unknown" &&
        entry.pilot_admission.decision_allowed.accept === false,
    ),
    true,
  );
  const queueResponse = await input.review_handlers.GET(
    routeRequest("/api/vnext/operator/semantic-review", {
      method: "GET",
      jar: input.jar,
    }),
  );
  const queueBody = await publicJson(queueResponse);
  assert.equal(queueResponse.status, 200);
  assert.equal(
    (queueBody.proposals as Array<{ proposal_id: string }>).some(
      (proposal) => proposal.proposal_id === strategicProposal.proposal_id,
    ),
    true,
  );
  assert.equal(input.gateway.transport_calls(), 1);
  assert.deepEqual(
    snapshotR6CSemanticAuthorityCounts(input.config),
    afterInsert,
  );
  pass(
    "strategic_proposal_uses_existing_pending_review_reader_without_get_writes",
  );

  const replayResponse = await input.review_handlers.POST(
    routeRequest("/api/vnext/operator/semantic-review", {
      method: "POST",
      jar: input.jar,
      body: analysisRequest,
    }),
  );
  const replayBody = await publicJson(replayResponse);
  assert.equal(replayResponse.status, 200, JSON.stringify(replayBody));
  assert.equal(replayBody.status, "exact_replay");
  assert.equal(replayBody.model_invocation_count, 0);
  assert.equal(
    (replayBody.proposal as EpisodeDeltaProposalV01).proposal_id,
    strategicProposal.proposal_id,
  );
  input.jar.absorb(replayResponse);
  assert.equal(input.gateway.transport_calls(), 1);
  assert.deepEqual(
    snapshotR6CSemanticAuthorityCounts(input.config),
    afterInsert,
  );
  const sourceAfterDb = openVNextLocalOperatorDatabaseV01(input.config);
  try {
    const sourceAfter = readVNextCoreRecordV01(sourceAfterDb, {
      record_kind: "episode_delta_proposal",
      record_id: proposalId,
      workspace_id: input.config.workspace_id,
      project_id: input.config.project_id,
    });
    assert(sourceAfter);
    assert.equal(
      canonicalizeProtocolValueV01(sourceAfter.payload),
      sourceBefore,
    );
  } finally {
    sourceAfterDb.close();
  }
  pass("strategic_exact_replay_reuses_one_invocation_and_proposal");
  pass("strategic_analysis_mutates_no_decision_transition_state_or_packet");

  input.clock.set("2026-07-11T09:21:40.000Z");
  const strategicReviewCandidate = detail.candidates[0];
  assert(strategicReviewCandidate);
  const deferResponse = await input.review_handlers.POST(
    routeRequest("/api/vnext/operator/semantic-review", {
      method: "POST",
      jar: input.jar,
      body: {
        proposal_id: strategicProposal.proposal_id,
        proposal_fingerprint: strategicProposal.integrity.fingerprint,
        candidate_id: strategicReviewCandidate.candidate.candidate_id,
        candidate_fingerprint: strategicReviewCandidate.candidate_fingerprint,
        decision: "defer",
        rationale_summary:
          "Defer this optional transfer until its exact accepted plan base and validation need are reviewed.",
        revisit: {
          condition_summary:
            "Revisit only while the exact accepted plan base remains current.",
        },
      },
    }),
  );
  const deferBody = await publicJson(deferResponse);
  assert.equal(deferResponse.status, 201, JSON.stringify(deferBody));
  assert.equal(deferBody.status, "inserted");
  assert.equal(deferBody.transition_requested, false);
  assert.equal(deferBody.transition_applied, false);
  input.jar.absorb(deferResponse);
  const afterDefer = snapshotR6CSemanticAuthorityCounts(input.config);
  assert.deepEqual(afterDefer, {
    ...afterInsert,
    decisions: afterInsert.decisions + 1,
  });
  const deferredDetailResponse = await input.review_handlers.GET(
    routeRequest("/api/vnext/operator/semantic-review", {
      method: "GET",
      jar: input.jar,
      query: { proposal_id: strategicProposal.proposal_id },
    }),
  );
  const deferredDetailBody = await publicJson(deferredDetailResponse);
  assert.equal(deferredDetailResponse.status, 200);
  const deferredDetail =
    deferredDetailBody.proposal as VNextOperatorPilotReviewDetailV01;
  assert.equal(deferredDetail.decision_count, 1);
  assert.equal(deferredDetail.transition.status, "not_applied");
  assert.equal(input.gateway.transport_calls(), 1);
  assert.deepEqual(
    snapshotR6CSemanticAuthorityCounts(input.config),
    afterDefer,
  );
  pass(
    "strategic_candidate_defer_uses_existing_decision_path_without_transition",
  );
}

async function assertOperationAwareProductionOperationsOnClonesV01(input: {
  environment: NodeJS.ProcessEnv;
  clock: ManualClock;
  secret_source: DeterministicSecretSource;
  source_proposal_id: string;
}): Promise<void> {
  const cases = [
    {
      operation: "revise" as const,
      expected_effect: "replace" as const,
      started_at: "2026-07-11T09:30:00.000Z",
    },
    {
      operation: "supersede" as const,
      expected_effect: "supersede" as const,
      started_at: "2026-07-11T09:40:00.000Z",
    },
    {
      operation: "retract" as const,
      expected_effect: "retract" as const,
      started_at: "2026-07-11T09:50:00.000Z",
    },
  ];
  for (const testCase of cases) {
    await withOperatorDatabaseCloneV01(
      `r6-c-operation-aware-${testCase.operation}`,
      input.environment,
      async ({ environment, config }) => {
        const startedAt = Date.parse(testCase.started_at);
        assert(Number.isFinite(startedAt));
        input.clock.set(new Date(startedAt).toISOString());
        const sessionHandlers = createVNextLocalOperatorSessionHandlersV01({
          environment,
          clock: input.clock,
          secret_source: input.secret_source,
        });
        const reviewHandlers = createVNextOperatorSemanticReviewHandlersV01({
          environment,
          clock: input.clock,
          secret_source: input.secret_source,
        });
        const transitionHandlers =
          createVNextOperatorSemanticTransitionHandlersV01({
            environment,
            clock: input.clock,
            secret_source: input.secret_source,
          });
        const bootstrap = issueBootstrap(
          environment,
          input.clock,
          input.secret_source,
        );
        rememberCredentialMaterial(bootstrap.bootstrap_token);
        const exchange = await bootstrapThroughRoute(
          sessionHandlers,
          bootstrap.bootstrap_token,
        );
        assert.equal(exchange.response.status, 200);
        const jar = new RouteCookieJar();
        jar.setPair(exchange.cookiePair);
        const sourceResponse = await reviewHandlers.GET(
          routeRequest("/api/vnext/operator/semantic-review", {
            method: "GET",
            jar,
            query: {
              proposal_id: input.source_proposal_id,
            },
          }),
        );
        const sourceBody = await publicJson(sourceResponse);
        assert.equal(sourceResponse.status, 200, JSON.stringify(sourceBody));
        const sourceDetail =
          sourceBody.proposal as VNextOperatorPilotReviewDetailV01;
        const sourceCandidate = sourceDetail.candidates.find(
          (entry) => entry.candidate.operation === "unknown",
        );
        assert(sourceCandidate);
        assert.equal(
          sourceCandidate.pilot_admission.current_state_status,
          "drifted",
        );
        const revisionResponse = await reviewHandlers.POST(
          routeRequest("/api/vnext/operator/semantic-review", {
            method: "POST",
            jar,
            body: {
              action: "revise",
              proposal_id: sourceDetail.proposal.proposal_id,
              proposal_fingerprint: sourceDetail.proposal.integrity.fingerprint,
              candidate_id: sourceCandidate.candidate.candidate_id,
              candidate_fingerprint: sourceCandidate.candidate_fingerprint,
              delta_type: "validation_delta",
              operation: testCase.operation,
              title: `Review exact ${testCase.operation} operation`,
              proposed_state_summary:
                testCase.operation === "retract"
                  ? "Retract the exact current validation state after explicit review."
                  : `Persist a distinct ${testCase.operation} validation state after exact current-state review.`,
              rationale_summary: `The exact current target is present and this immutable revision explicitly selects ${testCase.operation}.`,
              uncertainties: ["Task success remains unknown and insufficient."],
              limitations: [
                "This operation remains candidate material until decision and gate closure.",
              ],
            },
          }),
        );
        const revisionBody = await publicJson(revisionResponse);
        assert.equal(
          revisionResponse.status,
          201,
          JSON.stringify(revisionBody),
        );
        jar.absorb(revisionResponse);
        const revision = revisionBody.proposal as EpisodeDeltaProposalV01;
        const revisedCandidate = revision.proposed_deltas.find(
          (candidate) =>
            candidate.candidate_id ===
            revision.operation_revision?.revised_candidate.candidate_id,
        );
        assert(revisedCandidate);
        assert.equal(revisedCandidate.operation, testCase.operation);
        assert.equal(
          revision.operation_revision?.target_expectations.every(
            (expectation) =>
              expectation.presence === "present" &&
              expectation.revision > 0 &&
              Boolean(expectation.state_fingerprint) &&
              Boolean(expectation.source_transition_receipt_id) &&
              Boolean(expectation.source_transition_receipt_fingerprint),
          ),
          true,
        );
        const beforeFingerprint =
          revision.operation_revision!.target_expectations[0]!
            .state_fingerprint;

        input.clock.set(new Date(startedAt + 60_000).toISOString());
        const decisionResponse = await reviewHandlers.POST(
          routeRequest("/api/vnext/operator/semantic-review", {
            method: "POST",
            jar,
            body: {
              proposal_id: revision.proposal_id,
              proposal_fingerprint: revision.integrity.fingerprint,
              candidate_id: revisedCandidate.candidate_id,
              candidate_fingerprint: createProtocolSha256V01(
                  canonicalizeProtocolValueV01(revisedCandidate),
                ),
              decision: "accept",
              rationale_summary: `Explicitly accept the separately reviewable ${testCase.operation} candidate without implying application.`,
            },
          }),
        );
        const decisionBody = await publicJson(decisionResponse);
        assert.equal(
          decisionResponse.status,
          201,
          JSON.stringify(decisionBody),
        );
        jar.absorb(decisionResponse);
        const decision = decisionBody.decision as ReviewDecisionV01;
        const decisionBinding = {
          proposal_id: revision.proposal_id,
          proposal_fingerprint: revision.integrity.fingerprint,
          decision_id: decision.decision_id,
          decision_fingerprint: decision.integrity.fingerprint,
        };

        input.clock.set(new Date(startedAt + 120_000).toISOString());
        const previewResponse = await transitionHandlers.GET(
          routeRequest("/api/vnext/operator/semantic-transition", {
            method: "GET",
            jar,
            query: decisionBinding,
          }),
        );
        const previewBody = await publicJson(previewResponse);
        assert.equal(previewResponse.status, 200, JSON.stringify(previewBody));
        jar.absorb(previewResponse);
        const preview = previewBody.preview as VNextSemanticCommitPreviewV01;
        assert.equal(
          preview.intended_effects.every(
            (effect) => effect.operation === testCase.expected_effect,
          ),
          true,
        );
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
        assert.equal(confirmResponse.status, 201, JSON.stringify(confirmBody));
        jar.absorb(confirmResponse);
        const gate =
          confirmBody.gate_record as VNextSemanticCommitGateRecordV01;

        input.clock.set(new Date(startedAt + 180_000).toISOString());
        const beforeApply = snapshotR6CSemanticAuthorityCounts(config);
        const credential = readVNextLocalOperatorCredentialFromRequestV01(
            routeRequest("/api/vnext/operator/semantic-transition", {
              method: "GET",
              jar,
            }),
          );
        const applyDb = openVNextLocalOperatorDatabaseV01(config);
        let applyResult: ReturnType<
          typeof applyVNextOperatorPilotReviewedSemanticTransitionV01
        >;
        try {
          applyResult = applyVNextOperatorPilotReviewedSemanticTransitionV01(
            applyDb,
            {
              config,
              credential,
              request: {
                ...decisionBinding,
                gate_record_id: gate.gate_record_id,
                gate_record_fingerprint: gate.integrity.fingerprint,
                prior_packet_id: revision.task_context_packet_ref!.external_id,
                prior_packet_fingerprint:
                  revision.task_context_packet_ref!.source_ref!,
              },
              clock: input.clock,
              secret_source: input.secret_source,
            },
          );
        } finally {
          applyDb.close();
        }
        assert.equal(applyResult.status, "applied");
        assert.equal(applyResult.packet_status, "inserted");
        const receipt = applyResult.transition_receipt;
        const laterPacket = applyResult.later_packet;
        assert.equal(
          receipt.effects.every(
            (effect) =>
              effect.operation === testCase.expected_effect &&
              effect.before_state.presence === "present" &&
              effect.before_state.state_fingerprint === beforeFingerprint &&
              effect.after_state.presence ===
                (testCase.expected_effect === "retract" ? "absent" : "present"),
          ),
          true,
        );
        const acceptedSelections = laterPacket.selected_context.filter(
          (entry) => entry.entry_kind === "accepted_state_ref",
        );
        if (testCase.expected_effect === "retract") {
          assert.equal(
            acceptedSelections.some(
              (entry) => entry.source_ref === beforeFingerprint,
            ),
            false,
          );
          assert.equal(
            laterPacket.excluded_context.some(
              (entry) => entry.source_ref === beforeFingerprint,
            ),
            true,
          );
        } else {
          const afterFingerprint =
            receipt.effects[0]!.after_state.state_fingerprint;
          assert(afterFingerprint);
          assert.equal(
            acceptedSelections.some(
              (entry) => entry.source_ref === afterFingerprint,
            ),
            true,
          );
          assert.equal(
            acceptedSelections.some(
              (entry) => entry.source_ref === beforeFingerprint,
            ),
            false,
          );
        }
        const afterApply = snapshotR6CSemanticAuthorityCounts(config);
        assert.equal(afterApply.transitions, beforeApply.transitions + 1);
        assert.equal(afterApply.packets, beforeApply.packets + 1);
        assert.equal(
          afterApply.semantic_state_entries,
          testCase.expected_effect === "retract"
            ? beforeApply.semantic_state_entries - 1
            : beforeApply.semantic_state_entries,
        );
      },
    );
    pass(`operation_aware_${testCase.expected_effect}_production_vertical`);
  }
}

async function assertOperationRevisionImmutableMaterialConflictOnCloneV01(input: {
    environment: NodeJS.ProcessEnv;
    proposal: EpisodeDeltaProposalV01;
}): Promise<void> {
  await withOperatorDatabaseCloneV01(
    "r6-c-operation-revision-immutable-material-conflict",
    input.environment,
    async ({ config }) => {
      const db = openVNextLocalOperatorDatabaseV01(config);
      try {
        const forged = structuredClone(input.proposal);
        assert(forged.observations[0]);
        forged.observations[0].bounded_summary = `${forged.observations[0].bounded_summary} Forged rewrite.`;
        forged.proposal_id = deriveEpisodeDeltaProposalIdV01(forged);
        forged.integrity.fingerprint =
          createEpisodeDeltaProposalFingerprintV01(forged);
        db.exec("DROP TRIGGER trg_vnext_core_records_immutable_update");
        db.prepare(
          `UPDATE vnext_core_records
           SET record_id = ?, fingerprint = ?, payload_json = ?
           WHERE record_kind = 'episode_delta_proposal'
             AND record_id = ?`,
        ).run(
          forged.proposal_id,
          forged.integrity.fingerprint,
          canonicalizeProtocolValueV01(forged),
          input.proposal.proposal_id,
        );
        db.exec(`
          CREATE TRIGGER trg_vnext_core_records_immutable_update
            BEFORE UPDATE ON vnext_core_records
            BEGIN SELECT RAISE(ABORT, 'vnext_core_records_immutable'); END
        `);
        assert.throws(
          () =>
            readVNextOperatorPilotSemanticReviewV01(db, {
              config,
              proposal_id: forged.proposal_id,
              authenticated_session_id: null,
            }),
          (error) =>
            error instanceof VNextOperatorPilotReviewErrorV01 &&
            error.code ===
              "operator_pilot_revision_immutable_material_conflict",
        );
      } finally {
        db.close();
      }
    },
  );
  reject("proposal_revision_recomputed_forgery_refused_on_readback");
}

async function assertOperationRevisionDeltaTargetConflictOnCloneV01(input: {
  environment: NodeJS.ProcessEnv;
  proposal: EpisodeDeltaProposalV01;
}): Promise<void> {
  await withOperatorDatabaseCloneV01(
    "r6-c-operation-revision-delta-target-conflict",
    input.environment,
    async ({ config }) => {
      const db = openVNextLocalOperatorDatabaseV01(config);
      try {
        const forged = structuredClone(input.proposal);
        const revision = forged.operation_revision!;
        const revisedCandidate = forged.proposed_deltas.find(
          (candidate) =>
            candidate.candidate_id === revision.revised_candidate.candidate_id,
        )!;
        revisedCandidate.delta_type = "memory_delta";
        revision.selected_delta_type = "memory_delta";
        revision.revised_candidate.candidate_fingerprint =
          createEpisodeDeltaCandidateFingerprintV01(revisedCandidate);
        forged.proposal_id = deriveEpisodeDeltaProposalIdV01(forged);
        forged.integrity.fingerprint =
          createEpisodeDeltaProposalFingerprintV01(forged);
        db.exec("DROP TRIGGER trg_vnext_core_records_immutable_update");
        db.prepare(
          `UPDATE vnext_core_records
           SET record_id = ?, fingerprint = ?, payload_json = ?
           WHERE record_kind = 'episode_delta_proposal'
             AND record_id = ?`,
        ).run(
          forged.proposal_id,
          forged.integrity.fingerprint,
          canonicalizeProtocolValueV01(forged),
          input.proposal.proposal_id,
        );
        db.exec(`
          CREATE TRIGGER trg_vnext_core_records_immutable_update
            BEFORE UPDATE ON vnext_core_records
            BEGIN SELECT RAISE(ABORT, 'vnext_core_records_immutable'); END
        `);
        assert.throws(
          () =>
            readVNextOperatorPilotSemanticReviewV01(db, {
              config,
              proposal_id: forged.proposal_id,
              authenticated_session_id: null,
            }),
          (error) =>
            error instanceof VNextOperatorPilotReviewErrorV01 &&
            error.code === "operator_pilot_revision_delta_target_incompatible",
        );
      } finally {
        db.close();
      }
    },
  );
  reject("proposal_revision_incompatible_lane_recomputed_forgery_refused");
}

async function assertContextUseReviewProvenanceConflictOnCloneV01(input: {
  environment: NodeJS.ProcessEnv;
  review: ContextUseReviewV01;
}): Promise<void> {
  await withOperatorDatabaseCloneV01(
    "r6-c-context-use-provenance-conflict",
    input.environment,
    async ({ config }) => {
      const db = openVNextLocalOperatorDatabaseV01(config);
      try {
        const forged = structuredClone(input.review);
        forged.usage_provenance!.actually_used.source_refs[0]!.observed_at =
          "2026-07-11T09:28:01.000Z";
        forged.review_id = deriveContextUseReviewIdV01(forged);
        forged.integrity.fingerprint =
          createContextUseReviewFingerprintV01(forged);
        db.exec("DROP TRIGGER trg_vnext_core_records_immutable_update");
        db.prepare(
          `UPDATE vnext_core_records
           SET record_id = ?, fingerprint = ?, payload_json = ?
           WHERE record_kind = 'context_use_review'
             AND record_id = ?`,
        ).run(
          forged.review_id,
          forged.integrity.fingerprint,
          canonicalizeProtocolValueV01(forged),
          input.review.review_id,
        );
        db.exec(`
          CREATE TRIGGER trg_vnext_core_records_immutable_update
            BEFORE UPDATE ON vnext_core_records
            BEGIN SELECT RAISE(ABORT, 'vnext_core_records_immutable'); END
        `);
        assert.throws(
          () =>
            projectVNextOperatorPilotContinuityV01(db, {
              config,
              clock: { now: () => "2026-07-11T09:28:02.000Z" },
            }),
          /operator_pilot_context_use_review_usage_provenance_invalid/,
        );
      } finally {
        db.close();
      }
    },
  );
  reject("context_use_review_changed_provenance_conflict_refused");
}

async function assertAtomicTransitionPacketRollbackOnCloneV01(input: {
  environment: NodeJS.ProcessEnv;
  clock: ManualClock;
  secret_source: DeterministicSecretSource;
  jar: RouteCookieJar;
  request: Record<string, unknown>;
}): Promise<void> {
  await withOperatorDatabaseCloneV01(
    "r6-c-transition-packet-atomic-rollback",
    input.environment,
    async ({ config }) => {
      const credential = readVNextLocalOperatorCredentialFromRequestV01(
        routeRequest("/api/vnext/operator/semantic-transition", {
          method: "GET",
          jar: input.jar,
        }),
      );
      const before = snapshotR6CSemanticAuthorityCounts(config);
      const { action: _action, ...serviceRequest } = input.request;
      const db = openVNextLocalOperatorDatabaseV01(config);
      try {
        assert.throws(
          () =>
            applyVNextOperatorPilotReviewedSemanticTransitionV01(db, {
              config,
              credential,
              request: serviceRequest,
              clock: input.clock,
              secret_source: input.secret_source,
              test_options: {
                on_checkpoint: (checkpoint) => {
                  if (checkpoint === "after_receipt_insert_before_commit") {
                    throw new Error(
                      "injected_transition_packet_atomic_failure",
                    );
                  }
                },
              },
            }),
          /injected_transition_packet_atomic_failure/,
        );
      } finally {
        db.close();
      }
      assert.deepEqual(snapshotR6CSemanticAuthorityCounts(config), before);
    },
  );
  reject(
    "transition_packet_atomic_failure_rolls_back_state_receipt_and_packet",
  );
}

function snapshotR6CSemanticAuthorityCounts(
  config: VNextLocalOperatorPilotConfigV01,
) {
  const db = openVNextLocalOperatorDatabaseV01(config);
  try {
    return {
      semantic_state_entries: countTableRows(
        db,
        "vnext_semantic_state_entries",
      ),
      proposals: countRowsByKind(db, "episode_delta_proposal"),
      decisions: countRowsByKind(db, "review_decision"),
      transitions: countRowsByKind(db, "state_transition_receipt"),
      packets: countRowsByKind(db, "task_context_packet"),
      receipts: countRowsByKind(db, "run_receipt"),
      context_use_reviews: countRowsByKind(db, "context_use_review"),
    };
  } finally {
    db.close();
  }
}

async function assertCriterionAssessmentBindingRefusalsOnClonesV01(input: {
  environment: NodeJS.ProcessEnv;
  packet: TaskContextPacketV01;
  receipt: RunReceiptV01;
}): Promise<void> {
  await withOperatorDatabaseCloneV01(
    "criterion-assessment-receipt-id-conflict",
    input.environment,
    async ({ config }) => {
      const db = openVNextLocalOperatorDatabaseV01(config);
      try {
        const conflictingRecordId = "run-receipt:r6-a-envelope-id-conflict";
        insertVNextCoreRecordV01(db, {
          record_kind: "run_receipt",
          record_id: conflictingRecordId,
          workspace_id: config.workspace_id,
          project_id: config.project_id,
          fingerprint: input.receipt.integrity.fingerprint,
          idempotency_key: null,
          payload: input.receipt,
          created_at: input.receipt.recorded_at,
        });
        assert.throws(
          () =>
            readProjectRunResultDetailV01(db, {
              workspace_id: config.workspace_id,
              project_id: config.project_id,
              receipt_id: conflictingRecordId,
            }),
          (error) =>
            error instanceof ProjectRunResultReadErrorV01 &&
            error.code === "project_result_receipt_scope_conflict",
        );
      } finally {
        db.close();
      }
    },
  );

  await withOperatorDatabaseCloneV01(
    "criterion-assessment-receipt-fingerprint-conflict",
    input.environment,
    async ({ config }) => {
      const db = openVNextLocalOperatorDatabaseV01(config);
      try {
        const conflictingRecordId =
          "run-receipt:r6-a-envelope-fingerprint-conflict";
        insertVNextCoreRecordV01(db, {
          record_kind: "run_receipt",
          record_id: conflictingRecordId,
          workspace_id: config.workspace_id,
          project_id: config.project_id,
          fingerprint: `sha256:${"e".repeat(64)}`,
          idempotency_key: null,
          payload: input.receipt,
          created_at: input.receipt.recorded_at,
        });
        assert.throws(
          () =>
            readProjectRunResultDetailV01(db, {
              workspace_id: config.workspace_id,
              project_id: config.project_id,
              receipt_id: conflictingRecordId,
            }),
          /vnext_core_record_fingerprint_mismatch/u,
        );
      } finally {
        db.close();
      }
    },
  );

  await withOperatorDatabaseCloneV01(
    "criterion-assessment-run-relation-conflict",
    input.environment,
    async ({ config }) => {
      const db = openVNextLocalOperatorDatabaseV01(config);
      try {
        const update = db
          .prepare(
            `UPDATE autonomy_runs
             SET metadata_json = json_set(
               metadata_json,
               '$.run_receipt_id',
               'run-receipt:r6-a-conflicting-ledger-relation'
             )
             WHERE run_id = ?`,
          )
          .run(input.receipt.run_id);
        assert.equal(update.changes, 1);
        assert.throws(
          () =>
            readProjectRunResultDetailV01(db, {
              workspace_id: config.workspace_id,
              project_id: config.project_id,
              receipt_id: input.receipt.receipt_id,
            }),
          (error) =>
            error instanceof ProjectRunResultReadErrorV01 &&
            error.code === "project_result_receipt_run_conflict",
        );
      } finally {
        db.close();
      }
    },
  );

  await withOperatorDatabaseCloneV01(
    "criterion-assessment-packet-fingerprint-conflict",
    input.environment,
    async ({ config }) => {
      const db = openVNextLocalOperatorDatabaseV01(config);
      try {
        const receipt = structuredClone(input.receipt);
        receipt.run_id = "run-r6-a-packet-fingerprint-conflict";
        receipt.recorded_at = addIsoMillisecondsV01(
          input.receipt.recorded_at,
          1,
        );
        receipt.task_context_packet_ref = {
          ...receipt.task_context_packet_ref!,
          source_ref: `sha256:${"d".repeat(64)}`,
        };
        receipt.idempotency_key = createRunReceiptIdempotencyKeyV01(receipt);
        receipt.receipt_id = deriveRunReceiptIdV01(receipt);
        receipt.integrity.fingerprint = createRunReceiptFingerprintV01(receipt);
        assert.equal(validateRunReceiptV01(receipt).status, "valid");
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
        assert.throws(
          () =>
            readProjectRunResultDetailV01(db, {
              workspace_id: config.workspace_id,
              project_id: config.project_id,
              receipt_id: receipt.receipt_id,
            }),
          (error) =>
            error instanceof ProjectRunResultReadErrorV01 &&
            error.code === "project_result_packet_conflict",
        );
      } finally {
        db.close();
      }
    },
  );

  assert.equal(
    input.receipt.task_context_packet_ref?.external_id,
    input.packet.packet_id,
  );
  pass("criterion_assessment_binding_conflicts_fail_closed");
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
      assert.equal(body.proposal_created, true);
      const bodyProposal = body.proposal as Record<string, unknown>;
      assert.equal(bodyProposal.status, "available");
      assert.equal(bodyProposal.proposal_status, "pending_review");
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
      const replayBody = await publicJson(replay);
      assert.equal(replayBody.status, "exact_replay");
      assert.equal(replayBody.proposal_created, false);
      const replayProposal = replayBody.proposal as Record<string, unknown>;
      assert.equal(replayProposal.status, "available");
      assert.equal(replayProposal.admission_status, "exact_replay");
      assert.equal(observations.length, 1);
    },
  );
  pass("interactive_and_policy_modes_converge_on_direct_host_orchestrator");
  pass("direct_host_route_accepts_empty_body_only_and_rotates_session_nonce");
}

async function assertRunAssessmentProposalFailureSettlementOnCloneV01(input: {
  environment: NodeJS.ProcessEnv;
  packet: TaskContextPacketV01;
}): Promise<void> {
  await withOperatorDatabaseCloneV01(
    "run-assessment-proposal-failure-settlement",
    input.environment,
    async ({ config }) => {
      const clock = new ManualClock(
        addIsoMillisecondsV01(input.packet.generated_at, 40_000),
      );
      const observations: DeterministicCodexAdapterObservationV01[] = [];
      const adapter = createDeterministicCodexAdapterV01({
        now: () => clock.now(),
        observe: (observation) => observations.push(observation),
      });
      const db = openVNextLocalOperatorDatabaseV01(config);
      try {
        const before = {
          receipts: countRowsByKind(db, "run_receipt"),
          proposals: countRowsByKind(db, "episode_delta_proposal"),
          decisions: countRowsByKind(db, "review_decision"),
          transitions: countRowsByKind(db, "state_transition_receipt"),
          packets: countRowsByKind(db, "task_context_packet"),
          semantic_state_entries: countTableRows(
            db,
            "vnext_semantic_state_entries",
          ),
        };
        const packetBefore = readVNextCoreRecordV01(db, {
          record_kind: "task_context_packet",
          record_id: input.packet.packet_id,
          workspace_id: config.workspace_id,
          project_id: config.project_id,
        });
        assert(packetBefore);

        const failed = await runDirectNativeHostRoundTripV01(
          db,
          { config, mode: "interactive" },
          {
            adapter,
            now: () => clock.now(),
            proposal_admission: {
              admit_proposal: () => {
                throw Object.assign(
                  new Error("run_assessment_proposal_transient_writer_failure"),
                  {
                    code: "run_assessment_proposal_transient_writer_failure",
                  },
                );
              },
            },
          },
        );
        assert.equal(failed.status, "inserted");
        assert.equal(failed.host_result?.outcome, "completed");
        assert.equal(failed.receipt.execution.status, "completed");
        assert.deepEqual(failed.proposal, {
          status: "failed",
          error_code: "run_assessment_proposal_transient_writer_failure",
          retryable: true,
          failure_recorded: true,
          failure_recording_error_code: null,
        });
        assert.equal(failed.proposal_created, false);
        assert.equal(countRowsByKind(db, "run_receipt"), before.receipts + 1);
        assert.equal(
          countRowsByKind(db, "episode_delta_proposal"),
          before.proposals,
        );
        const receiptBeforeRetry = readVNextCoreRecordV01(db, {
          record_kind: "run_receipt",
          record_id: failed.receipt.receipt_id,
          workspace_id: config.workspace_id,
          project_id: config.project_id,
        });
        assert(receiptBeforeRetry);
        const failedRun = readAutonomyRunLedgerRecord(failed.run_id, { db });
        assert(failedRun);
        assert.equal(failedRun.status, "completed");
        assert.equal(
          failedRun.metadata.run_assessment_proposal_status,
          "failed",
        );
        assert.equal(
          failedRun.metadata.run_assessment_proposal_retry_required,
          true,
        );
        assert.equal(
          failedRun.metadata.run_assessment_proposal_error_code,
          "run_assessment_proposal_transient_writer_failure",
        );
        const failedRead = readProjectRunResultDetailV01(db, {
          workspace_id: config.workspace_id,
          project_id: config.project_id,
          receipt_id: failed.receipt.receipt_id,
        });
        assert.deepEqual(failedRead.proposal, {
          status: "failed",
          error_code: "run_assessment_proposal_transient_writer_failure",
          retryable: true,
          failure_recorded: true,
          failure_recording_error_code: null,
        });

        const retry = await runDirectNativeHostRoundTripV01(
          db,
          { config, mode: "interactive" },
          { adapter, now: () => clock.now() },
        );
        assert.equal(retry.status, "exact_replay");
        assert.equal(retry.host_result, null);
        assert.equal(retry.receipt.receipt_id, failed.receipt.receipt_id);
        assert.equal(retry.proposal.status, "available");
        assert.equal(
          retry.proposal.status === "available"
            ? retry.proposal.admission_status
            : null,
          "inserted",
        );
        assert.equal(retry.proposal_created, true);
        assert.equal(
          countRowsByKind(db, "episode_delta_proposal"),
          before.proposals + 1,
        );
        assert.deepEqual(
          readVNextCoreRecordV01(db, {
            record_kind: "run_receipt",
            record_id: failed.receipt.receipt_id,
            workspace_id: config.workspace_id,
            project_id: config.project_id,
          }),
          receiptBeforeRetry,
        );
        const recoveredRun = readAutonomyRunLedgerRecord(failed.run_id, { db });
        assert(recoveredRun);
        assert.equal(recoveredRun.status, "completed");
        assert.equal(
          recoveredRun.metadata.run_assessment_proposal_status,
          "available",
        );
        assert.equal(
          recoveredRun.metadata.run_assessment_proposal_retry_required,
          false,
        );
        const recoveredRead = readProjectRunResultDetailV01(db, {
          workspace_id: config.workspace_id,
          project_id: config.project_id,
          receipt_id: failed.receipt.receipt_id,
        });
        assert.equal(recoveredRead.proposal.status, "available");

        const exactReplay = await runDirectNativeHostRoundTripV01(
          db,
          { config, mode: "interactive" },
          { adapter, now: () => clock.now() },
        );
        assert.equal(exactReplay.status, "exact_replay");
        assert.equal(exactReplay.proposal.status, "available");
        assert.equal(
          exactReplay.proposal.status === "available"
            ? exactReplay.proposal.admission_status
            : null,
          "exact_replay",
        );
        assert.equal(exactReplay.proposal_created, false);
        assert.equal(observations.length, 1);
        assert.deepEqual(
          {
            receipts: countRowsByKind(db, "run_receipt"),
            proposals: countRowsByKind(db, "episode_delta_proposal"),
            decisions: countRowsByKind(db, "review_decision"),
            transitions: countRowsByKind(db, "state_transition_receipt"),
            packets: countRowsByKind(db, "task_context_packet"),
            semantic_state_entries: countTableRows(
              db,
              "vnext_semantic_state_entries",
            ),
          },
          {
            ...before,
            receipts: before.receipts + 1,
            proposals: before.proposals + 1,
          },
        );
        assert.deepEqual(
          readVNextCoreRecordV01(db, {
            record_kind: "task_context_packet",
            record_id: input.packet.packet_id,
            workspace_id: config.workspace_id,
            project_id: config.project_id,
          }),
          packetBefore,
        );
      } finally {
        db.close();
      }
    },
  );
  await withOperatorDatabaseCloneV01(
    "run-assessment-proposal-non-retryable-settlement",
    input.environment,
    async ({ config }) => {
      const clock = new ManualClock(
        addIsoMillisecondsV01(input.packet.generated_at, 40_000),
      );
      const adapter = createDeterministicCodexAdapterV01({
        now: () => clock.now(),
      });
      const db = openVNextLocalOperatorDatabaseV01(config);
      let writerAttempts = 0;
      const deterministicFailure = {
        admit_proposal: () => {
          writerAttempts += 1;
          throw Object.assign(
            new Error("run_assessment_proposal_source_material_bound_exceeded"),
            {
              code: "run_assessment_proposal_source_material_bound_exceeded",
            },
          );
        },
      };
      try {
        const before = {
          receipts: countRowsByKind(db, "run_receipt"),
          proposals: countRowsByKind(db, "episode_delta_proposal"),
          decisions: countRowsByKind(db, "review_decision"),
          transitions: countRowsByKind(db, "state_transition_receipt"),
          packets: countRowsByKind(db, "task_context_packet"),
          semantic_state_entries: countTableRows(
            db,
            "vnext_semantic_state_entries",
          ),
        };
        const packetBefore = readVNextCoreRecordV01(db, {
          record_kind: "task_context_packet",
          record_id: input.packet.packet_id,
          workspace_id: config.workspace_id,
          project_id: config.project_id,
        });
        assert(packetBefore);
        const failed = await runDirectNativeHostRoundTripV01(
          db,
          { config, mode: "interactive" },
          {
            adapter,
            now: () => clock.now(),
            proposal_admission: deterministicFailure,
          },
        );
        assert.equal(failed.status, "inserted");
        assert.equal(failed.receipt.execution.status, "completed");
        assert.deepEqual(failed.proposal, {
          status: "failed",
          error_code: "run_assessment_proposal_source_material_bound_exceeded",
          retryable: false,
          failure_recorded: true,
          failure_recording_error_code: null,
        });
        assert.equal(writerAttempts, 1);
        const replay = await runDirectNativeHostRoundTripV01(
          db,
          { config, mode: "interactive" },
          {
            adapter,
            now: () => clock.now(),
            proposal_admission: deterministicFailure,
          },
        );
        assert.equal(replay.status, "exact_replay");
        assert.equal(replay.receipt.receipt_id, failed.receipt.receipt_id);
        assert.deepEqual(replay.proposal, failed.proposal);
        assert.equal(writerAttempts, 1);
        assert.equal(
          countRowsByKind(db, "episode_delta_proposal"),
          before.proposals,
        );
        const failedRun = readAutonomyRunLedgerRecord(failed.run_id, { db });
        assert(failedRun);
        assert.equal(failedRun.status, "completed");
        assert.equal(
          failedRun.metadata.run_assessment_proposal_retry_required,
          false,
        );
        assert.deepEqual(
          readProjectRunResultDetailV01(db, {
            workspace_id: config.workspace_id,
            project_id: config.project_id,
            receipt_id: failed.receipt.receipt_id,
          }).proposal,
          {
            status: "failed",
            error_code:
              "run_assessment_proposal_source_material_bound_exceeded",
            retryable: false,
            failure_recorded: true,
            failure_recording_error_code: null,
          },
        );
        assert.deepEqual(
          {
            receipts: countRowsByKind(db, "run_receipt"),
            proposals: countRowsByKind(db, "episode_delta_proposal"),
            decisions: countRowsByKind(db, "review_decision"),
            transitions: countRowsByKind(db, "state_transition_receipt"),
            packets: countRowsByKind(db, "task_context_packet"),
            semantic_state_entries: countTableRows(
              db,
              "vnext_semantic_state_entries",
            ),
          },
          {
            ...before,
            receipts: before.receipts + 1,
          },
        );
        assert.deepEqual(
          readVNextCoreRecordV01(db, {
            record_kind: "task_context_packet",
            record_id: input.packet.packet_id,
            workspace_id: config.workspace_id,
            project_id: config.project_id,
          }),
          packetBefore,
        );
      } finally {
        db.close();
      }
    },
  );
  await withOperatorDatabaseCloneV01(
    "run-assessment-proposal-failure-recording-failure",
    input.environment,
    async ({ config }) => {
      const clock = new ManualClock(
        addIsoMillisecondsV01(input.packet.generated_at, 40_000),
      );
      const adapter = createDeterministicCodexAdapterV01({
        now: () => clock.now(),
      });
      const db = openVNextLocalOperatorDatabaseV01(config);
      try {
        const beforeProposals = countRowsByKind(db, "episode_delta_proposal");
        const failed = await runDirectNativeHostRoundTripV01(
          db,
          { config, mode: "interactive" },
          {
            adapter,
            now: () => clock.now(),
            proposal_admission: {
              admit_proposal: () => {
                throw Object.assign(
                  new Error("run_assessment_proposal_transient_writer_failure"),
                  {
                    code: "run_assessment_proposal_transient_writer_failure",
                  },
                );
              },
              record_failure: () => {
                throw Object.assign(
                  new Error(
                    "run_assessment_proposal_failure_metadata_unavailable",
                  ),
                  {
                    code: "run_assessment_proposal_failure_metadata_unavailable",
                  },
                );
              },
            },
          },
        );
        assert.equal(failed.status, "inserted");
        assert.equal(failed.receipt.execution.status, "completed");
        assert.deepEqual(failed.proposal, {
          status: "failed",
          error_code: "run_assessment_proposal_transient_writer_failure",
          retryable: true,
          failure_recorded: false,
          failure_recording_error_code:
            "run_assessment_proposal_failure_metadata_unavailable",
        });
        assert.equal(
          countRowsByKind(db, "episode_delta_proposal"),
          beforeProposals,
        );
        const completedRun = readAutonomyRunLedgerRecord(failed.run_id, { db });
        assert(completedRun);
        assert.equal(completedRun.status, "completed");
        assert.equal(
          completedRun.metadata.run_receipt_id,
          failed.receipt.receipt_id,
        );
      } finally {
        db.close();
      }
    },
  );
  pass("proposal_failure_preserves_receipt_and_completed_execution");
  pass("proposal_failure_retry_creates_or_replays_exactly_one_proposal");
  pass("proposal_non_retryable_failure_is_not_automatically_retried");
  pass("proposal_failure_recording_cannot_mask_committed_receipt");
}

let liveFixtureSequenceV01 = 0;

async function assertLiveCodexAppServerLifecycleOnClonesV01(input: {
  environment: NodeJS.ProcessEnv;
  config: VNextLocalOperatorPilotConfigV01;
  clock: ManualClock;
  secret_source: DeterministicSecretSource;
  jar: RouteCookieJar;
  packet: TaskContextPacketV01;
  transition_receipt: StateTransitionReceiptV01;
}): Promise<void> {
  const guardedService = new LiveNativeHostRunServiceV01({
    now: () => input.clock.now(),
  });
  await assert.rejects(
    () =>
      guardedService.start({
        config: input.config,
        mode: "interactive",
      }),
    /live_host_operator_authority_required/,
  );
  reject(
    "live_codex_interactive_start_without_local_operator_authority_refused",
  );
  await assertLiveCodexSequentialApprovalAccountingOnCloneV01(input);
  await assertLiveCodexServerRequestConflictCasesOnClonesV01(input);
  await assertLiveCodexPublicSafeCommandPersistenceOnCloneV01(input);
  await assertLiveCodexGoldenApprovalOnCloneV01(input);
  try {
    await assertLiveCodexApprovalReplayAndContainmentOnClonesV01(input);
  } catch (error) {
    throw new Error(
      `live_codex_approval_replay_case:${error instanceof Error ? error.message : "failed"}`,
    );
  }
  try {
    await assertLiveCodexPolicyApprovalParityOnClonesV01(input);
  } catch (error) {
    throw new Error(
      `live_codex_policy_approval_case:${error instanceof Error ? error.message : "failed"}`,
    );
  }
  await assertLiveCodexCancellationSettlementOnCloneV01(input);
  await assertLiveCodexTimeoutSettlementOnCloneV01(input);
  try {
    await assertLiveCodexRuntimeShutdownAndDescendantCleanupOnCloneV01(input);
  } catch (error) {
    throw new Error(
      `live_codex_process_owner_case:${error instanceof Error ? error.message : "failed"}`,
    );
  }
  await assertLiveCodexDisconnectResumeOnCloneV01(input);
  await assertLiveCodexFailureMatrixOnClonesV01(input);
}

async function assertLiveCodexSequentialApprovalAccountingOnCloneV01(input: {
  environment: NodeJS.ProcessEnv;
  packet: TaskContextPacketV01;
}): Promise<void> {
  await withOperatorDatabaseCloneV01(
    "live-codex-sequential-approval-accounting",
    input.environment,
    async ({ config }) => {
      const clock = new ManualClock(
        addIsoMillisecondsV01(input.packet.generated_at, 30_100),
      );
      const automation = directHostPolicyContextV01(clock.now());
      installPolicySafeLivePacketV01(config, input.packet, automation, {
        approval_capabilities: ["native_host_approval:command_execution"],
        resources: [`command:${createProtocolSha256V01("npm test")}`],
        expires_at: addIsoMillisecondsV01(clock.now(), 60_000),
      });
      const harness = createFakeLiveCodexHarnessV01({
        config,
        scenario: "sequential_approval_chain",
        now: () => clock.now(),
      });
      const receiptsBefore = countRunReceiptsV01(config);
      try {
        const start = await harness.service.start({
          config,
          mode: "policy_triggered",
          automation_context: automation,
        });
        assert.equal(start.status, "accepted");
        const completed = await waitForLiveProjectionV01(
          harness.service,
          config,
          (value) => value.status === "completed",
          10_000,
          "sequential_approval_completion",
        );
        assert(completed.receipt);
        assert.equal(countRunReceiptsV01(config), receiptsBefore + 1);
        const run = readHostRunStateFromConfigV01(config, completed.run_ref!);
        const decisions = Array.isArray(run.metadata.approval_decisions)
          ? run.metadata.approval_decisions
          : [];
        assert.equal(decisions.length, 20);
        assert.equal(
          decisions.every(
            (decision) =>
              decision.decision === "approve_once" &&
              decision.decision_source === "bounded_capability_grant",
          ),
          true,
        );
        assert.equal(
          readFakeTraceV01(harness.trace_path).some(
            (entry) =>
              entry.value.error_reason ===
              "codex_server_request_bound_exceeded",
          ),
          false,
        );
        assert.equal(
          harness.observations.filter(
            (entry) => entry.kind === "approval_requested",
          ).length,
          20,
        );
        assert.equal(
          harness.observations.filter(
            (entry) => entry.kind === "approval_resolved",
          ).length,
          20,
        );
        assert.equal(
          Math.max(
            ...harness.observations.map(
              (entry) => entry.active_server_request_count,
            ),
          ),
          1,
        );
        assert.equal(
          Math.max(
            ...harness.observations.map(
              (entry) => entry.recent_resolved_server_request_count,
            ),
          ),
          16,
        );
        const cleared = harness.observations.filter(
          (entry) => entry.kind === "server_request_state_cleared",
        );
        assert.equal(cleared.length, 1);
        assert.equal(cleared[0]!.active_server_request_count, 0);
        assert.equal(cleared[0]!.recent_resolved_server_request_count, 0);
        assert.equal(readNetworkAttemptsV01(harness.network_count_path), 0);
        assertObservedProcessesStoppedV01(harness.observations);
      } finally {
        await harness.service.shutdown();
      }
    },
  );
  pass("live_codex_twenty_sequential_approvals_use_one_active_slot");
  pass(
    "live_codex_resolved_server_request_history_is_hash_only_bounded_and_cleared",
  );
}

async function assertLiveCodexServerRequestConflictCasesOnClonesV01(input: {
  environment: NodeJS.ProcessEnv;
  jar: RouteCookieJar;
  packet: TaskContextPacketV01;
}): Promise<void> {
  for (const [scenario, reason] of [
    ["concurrent_approval_overflow", "codex_server_request_bound_exceeded"],
    ["active_duplicate_request", "codex_server_request_duplicate_active"],
    ["active_conflicting_request", "codex_server_request_conflict"],
  ] as const) {
    await withOperatorDatabaseCloneV01(
      `live-codex-${scenario}`,
      input.environment,
      async ({ config }) => {
        installPublicSafeLivePacketV01(config, input.packet);
        const clock = new ManualClock(
          addIsoMillisecondsV01(input.packet.generated_at, 30_200),
        );
        const harness = createFakeLiveCodexHarnessV01({
          config,
          scenario,
          now: () => clock.now(),
        });
        const receiptsBefore = countRunReceiptsV01(config);
        try {
          await harness.service.start({ config, mode: "interactive" });
          const projection = await waitForLiveProjectionV01(
            harness.service,
            config,
            (value) => value.status === "paused",
            10_000,
            scenario,
          );
          assert.equal(projection.public_reason, reason);
          assert.equal(projection.receipt, null);
          assert.equal(countRunReceiptsV01(config), receiptsBefore);
          const cleared = harness.observations.at(-2);
          assert.equal(cleared?.kind, "server_request_state_cleared");
          assert.equal(cleared?.active_server_request_count, 0);
          assert.equal(cleared?.recent_resolved_server_request_count, 0);
          assert.equal(readNetworkAttemptsV01(harness.network_count_path), 0);
          assertObservedProcessesStoppedV01(harness.observations, scenario);
        } finally {
          await harness.service.shutdown();
        }
      },
    );
  }

  for (const [scenario, reason] of [
    ["resolved_duplicate_request", "codex_server_request_duplicate_resolved"],
    ["resolved_conflicting_request", "codex_server_request_resolved_conflict"],
  ] as const) {
    await withOperatorDatabaseCloneV01(
      `live-codex-${scenario}`,
      input.environment,
      async ({ config, environment }) => {
        installPublicSafeLivePacketV01(config, input.packet);
        const clock = new ManualClock(
          addIsoMillisecondsV01(input.packet.generated_at, 30_300),
        );
        const harness = createFakeLiveCodexHarnessV01({
          config,
          scenario,
          now: () => clock.now(),
        });
        const post = createVNextOperatorHostRoundTripHandlerV01({
          environment,
          clock,
          secret_source: new DeterministicSecretSource(),
          live_service: harness.service,
        });
        const jar = cloneRouteCookieJarV01(input.jar);
        try {
          const start = await post(
            routeRequest("/api/vnext/operator/host-round-trip", {
              method: "POST",
              jar,
              body: { action: "start_live" },
            }),
          );
          jar.absorb(start);
          const waiting = await waitForLiveProjectionV01(
            harness.service,
            config,
            (value) => value.status === "waiting_for_approval",
          );
          const approval = waiting.pending_approval!;
          const decision = await post(
            routeRequest("/api/vnext/operator/host-round-trip", {
              method: "POST",
              jar,
              body: {
                action: "approve_once",
                run_ref: waiting.run_ref,
                approval_ref: approval.approval_ref,
                control_revision: approval.control_revision,
              },
            }),
          );
          assert.equal(decision.status, 200);
          jar.absorb(decision);
          const projection = await waitForLiveProjectionV01(
            harness.service,
            config,
            (value) => value.status === "paused",
            10_000,
            scenario,
          );
          assert.equal(projection.public_reason, reason);
          assert.equal(projection.receipt, null);
          assert.equal(readNetworkAttemptsV01(harness.network_count_path), 0);
          assertObservedProcessesStoppedV01(harness.observations, scenario);
        } finally {
          await harness.service.shutdown();
        }
      },
    );
  }
  reject(
    "live_codex_nine_concurrent_server_requests_fail_closed_without_receipt",
  );
  reject(
    "live_codex_active_duplicate_and_conflicting_server_requests_fail_closed",
  );
  reject(
    "live_codex_resolved_request_id_reuse_is_deterministic_and_fail_closed",
  );
}

async function assertLiveCodexPublicSafeCommandPersistenceOnCloneV01(input: {
  environment: NodeJS.ProcessEnv;
  jar: RouteCookieJar;
  packet: TaskContextPacketV01;
}): Promise<void> {
  const rawCommand = String.raw`/usr/bin/env tool --client-secret super-secret-value --header "Authorization: Bearer header-secret-value" node /home/private/project/script.js`;
  const forbidden = [
    rawCommand,
    "super-secret-value",
    "header-secret-value",
    "/usr/bin/env",
    "/home/private/project/script.js",
  ];
  await withOperatorDatabaseCloneV01(
    "live-codex-public-safe-command-persistence",
    input.environment,
    async ({ config, environment }) => {
      installPublicSafeLivePacketV01(config, input.packet);
      const clock = new ManualClock(
        addIsoMillisecondsV01(input.packet.generated_at, 30_400),
      );
      const harness = createFakeLiveCodexHarnessV01({
        config,
        scenario: "public_safe_command_approval",
        now: () => clock.now(),
      });
      const post = createVNextOperatorHostRoundTripHandlerV01({
        environment,
        clock,
        secret_source: new DeterministicSecretSource(),
        live_service: harness.service,
      });
      const get = createVNextOperatorHostRoundTripReadHandlerV01({
        environment,
        clock,
        live_service: harness.service,
      });
      const jar = cloneRouteCookieJarV01(input.jar);
      try {
        const start = await post(
          routeRequest("/api/vnext/operator/host-round-trip", {
            method: "POST",
            jar,
            body: { action: "start_live" },
          }),
        );
        jar.absorb(start);
        let projection = await waitForLiveProjectionV01(
          harness.service,
          config,
          (value) => value.status === "waiting_for_approval",
        );
        const approval = projection.pending_approval!;
        assert.equal(
          approval.command_summary,
          "[absolute-path] tool --client-secret [redacted] --header Authorization: Bearer [redacted] node [absolute-path]",
        );
        const read = await get(
          routeRequest("/api/vnext/operator/host-round-trip", {
            method: "GET",
            jar,
          }),
        );
        const publicProjection = canonicalizeProtocolValueV01(
          await publicJson(read),
        );
        for (const value of forbidden) {
          assert.equal(publicProjection.includes(value), false, value);
        }
        const pendingRun = readHostRunStateFromConfigV01(
          config,
          projection.run_ref!,
        );
        const durablePendingApproval = pendingRun.metadata
          .pending_approval as Record<string, unknown> | null;
        assert(durablePendingApproval);
        assert.equal(
          durablePendingApproval.command_fingerprint,
          createProtocolSha256V01(rawCommand),
        );
        assert.notEqual(
          durablePendingApproval.command_fingerprint,
          createProtocolSha256V01(
            rawCommand.replace("super-secret-value", "different-secret-value"),
          ),
        );
        const pendingDurable = canonicalizeProtocolValueV01(pendingRun);
        assert.equal(pendingDurable.includes("[redacted]"), true);
        assert.equal(pendingDurable.includes("[absolute-path]"), true);
        for (const value of forbidden) {
          assert.equal(pendingDurable.includes(value), false, value);
        }
        assertDatabaseArtifactsOmitTextV01(config.database_path, forbidden);

        const response = await post(
          routeRequest("/api/vnext/operator/host-round-trip", {
            method: "POST",
            jar,
            body: {
              action: "approve_once",
              run_ref: projection.run_ref,
              approval_ref: approval.approval_ref,
              control_revision: approval.control_revision,
            },
          }),
        );
        assert.equal(response.status, 200);
        jar.absorb(response);
        projection = await waitForLiveProjectionV01(
          harness.service,
          config,
          (value) => value.status === "completed",
        );
        const terminalRun = readHostRunStateFromConfigV01(
          config,
          projection.run_ref!,
        );
        const terminalDurable = canonicalizeProtocolValueV01({
          run: terminalRun,
          receipt: projection.receipt,
          trace: readFakeTraceV01(harness.trace_path),
        });
        for (const value of forbidden) {
          assert.equal(terminalDurable.includes(value), false, value);
        }
        assertDatabaseArtifactsOmitTextV01(config.database_path, forbidden);
        assert.equal(readNetworkAttemptsV01(harness.network_count_path), 0);
        assertObservedProcessesStoppedV01(harness.observations);
      } finally {
        await harness.service.shutdown();
      }
    },
  );
  pass("live_codex_command_approval_api_ledger_and_receipt_are_public_safe");
  pass("live_codex_raw_command_fingerprint_uses_unredacted_ephemeral_material");
}

async function assertLiveCodexGoldenApprovalOnCloneV01(input: {
  environment: NodeJS.ProcessEnv;
  jar: RouteCookieJar;
  packet: TaskContextPacketV01;
  transition_receipt: StateTransitionReceiptV01;
}): Promise<void> {
  await withOperatorDatabaseCloneV01(
    "live-codex-golden-approval",
    input.environment,
    async ({ config, environment }) => {
      const livePacket = installPublicSafeLivePacketV01(config, input.packet);
      const clock = new ManualClock(
        addIsoMillisecondsV01(input.packet.generated_at, 31_000),
      );
      const harness = createFakeLiveCodexHarnessV01({
        config,
        scenario: "command_approval",
        now: () => clock.now(),
      });
      const post = createVNextOperatorHostRoundTripHandlerV01({
        environment,
        clock,
        secret_source: new DeterministicSecretSource(),
        live_service: harness.service,
      });
      const get = createVNextOperatorHostRoundTripReadHandlerV01({
        environment,
        clock,
        live_service: harness.service,
      });
      const jar = cloneRouteCookieJarV01(input.jar);
      const db = openVNextLocalOperatorDatabaseV01(config);
      const receiptsBefore = countRowsByKind(db, "run_receipt");
      db.close();
      try {
        const start = await post(
          routeRequest("/api/vnext/operator/host-round-trip", {
            method: "POST",
            jar,
            body: { action: "start_live" },
          }),
        );
        assert.equal(start.status, 202);
        jar.absorb(start);
        const startBody = await publicJson(start);
        assert.equal(startBody.path_kind, "live_codex_app_server");
        let projection = projectionFromRouteBodyV01(startBody);
        assert.equal(projection.packet_copy_actions, 0);
        assert.equal(projection.handoff_paste_actions, 0);
        assert.equal(projection.result_paste_actions, 0);
        assert.equal(projection.internal_id_entry_actions, 0);

        try {
          projection = await waitForLiveProjectionV01(
            harness.service,
            config,
            (value) => value.status === "waiting_for_approval",
          );
        } catch (error) {
          const trace = readFakeTraceV01(harness.trace_path).slice(-24);
          throw new Error(
            `${error instanceof Error ? error.message : "live_projection_failed"}:observations=${JSON.stringify(harness.observations)}:trace=${JSON.stringify(trace)}`,
          );
        }
        assert(projection.run_ref);
        assert(projection.pending_approval);
        assert.equal(
          projection.pending_approval.operation_class,
          "command_execution",
        );
        assert.equal(
          projection.capability.cli_version,
          "codex-cli/fake-0.143.0",
        );
        assert.equal(projection.pending_approval.command_summary, "npm test");
        assert.equal(projection.pending_approval.decision_submitted, false);
        assert.equal(countRunReceiptsV01(config), receiptsBefore);
        assert.equal(
          readHostRunStateFromConfigV01(config, projection.run_ref).status,
          "waiting_for_approval",
        );
        const waitingDb = openVNextLocalOperatorDatabaseV01(config);
        const waitingOverview = readProjectRunResultOverviewV01(waitingDb, {
          workspace_id: config.workspace_id,
          project_id: config.project_id,
        });
        waitingDb.close();
        assert.equal(
          waitingOverview.current_run?.status,
          "waiting_for_approval",
        );
        assert.equal(waitingOverview.current_run?.receipt_available, false);
        assert.equal(waitingOverview.latest_result_state, "available");
        assert(waitingOverview.latest_result);

        const activeReplay = await harness.service.start({
          config,
          mode: "interactive",
        });
        assert.equal(activeReplay.status, "exact_replay");
        assert.equal(activeReplay.projection.run_ref, projection.run_ref);
        await assert.rejects(
          () =>
            harness.service.start({
              config,
              mode: "policy_triggered",
              automation_context: directHostPolicyContextV01(clock.now()),
            }),
          /live_host_start_conflict/,
        );
        assert.equal(
          countTraceMethodV01(
            readFakeTraceV01(harness.trace_path),
            "thread/start",
          ),
          1,
        );

        const read = await get(
          routeRequest("/api/vnext/operator/host-round-trip", {
            method: "GET",
            jar,
          }),
        );
        assert.equal(read.status, 200);
        assert.equal(
          projectionFromRouteBodyV01(await publicJson(read)).status,
          "waiting_for_approval",
        );

        const approval = projection.pending_approval;
        const approve = await post(
          routeRequest("/api/vnext/operator/host-round-trip", {
            method: "POST",
            jar,
            body: {
              action: "approve_once",
              run_ref: projection.run_ref,
              approval_ref: approval.approval_ref,
              control_revision: approval.control_revision,
            },
          }),
        );
        assert.equal(approve.status, 200);
        jar.absorb(approve);
        assert.equal((await publicJson(approve)).decision_created, false);
        try {
          projection = await waitForLiveProjectionV01(
            harness.service,
            config,
            (value) => value.status === "completed",
          );
        } catch (error) {
          throw new Error(
            `${error instanceof Error ? error.message : "live_completion_failed"}:trace=${JSON.stringify(readFakeTraceV01(harness.trace_path).slice(-32))}`,
          );
        }
        assert(projection.receipt);
        assert.equal(countRunReceiptsV01(config), receiptsBefore + 1);
        assert.equal(existsSync(harness.cleanup_marker_path), true);
        assert.equal(readNetworkAttemptsV01(harness.network_count_path), 0);

        const run = readHostRunStateFromConfigV01(config, projection.run_ref!);
        assert.equal(
          run.events.some(
            (event) =>
              event.event_type === "host_event_observed" &&
              event.payload.event_kind === "thread_status_changed",
          ),
          true,
        );
        const receiptId = String(run.metadata.run_receipt_id);
        const receiptDb = openVNextLocalOperatorDatabaseV01(config);
        const record = readVNextCoreRecordV01(receiptDb, {
          record_kind: "run_receipt",
          record_id: receiptId,
          workspace_id: config.workspace_id,
          project_id: config.project_id,
        });
        const resultDetail = await waitForRunAssessmentProposalV01(receiptDb, {
          workspace_id: config.workspace_id,
          project_id: config.project_id,
          receipt_id: receiptId,
        });
        receiptDb.close();
        assert(record);
        const receipt = record.payload as RunReceiptV01;
        assert.equal(validateRunReceiptV01(receipt).status, "valid");
        assert.equal(receipt.workspace_id, config.workspace_id);
        assert.equal(receipt.project_id, config.project_id);
        assert.equal(
          receipt.task_context_packet_ref?.external_id,
          livePacket.packet_id,
        );
        assert.equal(
          receipt.task_context_packet_ref?.source_ref,
          livePacket.integrity.fingerprint,
        );
        assert.equal(
          receipt.source_refs.some(
            (ref) =>
              ref.ref_type === "state_transition_receipt" &&
              ref.external_id ===
                input.transition_receipt.transition_receipt_id,
          ),
          true,
        );
        assert.equal(receipt.privacy_egress.egress_status, "occurred");
        assert.equal(receipt.privacy_egress.raw_prompt_persisted, false);
        assert.equal(receipt.privacy_egress.raw_output_persisted, false);
        assert.equal(receipt.privacy_egress.raw_transcript_persisted, false);
        assert.equal(receipt.privacy_egress.secret_material_persisted, false);
        assert.equal(receipt.model_invocations.length, 0);
        assert.equal(receipt.execution.basis, "mixed");
        assert.equal(receipt.verification.basis, "mixed");
        assert.equal(receipt.verifier_refs.length, 1);
        assert.equal(
          receipt.verifier_refs[0]?.external_id,
          receipt.reporter_ref.external_id,
        );
        assert.equal(
          receipt.checks.find(
            (check) => check.check_id === "validated_packet_delivery",
          )?.basis,
          "observed",
        );
        assert.equal(
          receipt.checks.find((check) => check.check_id === "fake-live-check")
            ?.basis,
          "attested",
        );
        assert.equal(
          receipt.changed_artifacts.some(
            (artifact) =>
              artifact.artifact_ref.external_id === "src/live-result.ts" &&
              artifact.basis === "attested",
          ),
          true,
        );
        assert.equal(receipt.commands.length, 1);
        assert.equal(receipt.commands[0]?.command_id, "fake-command-item");
        assert.equal(receipt.commands[0]?.summary, "npm test");
        assert.equal(receipt.commands[0]?.status, "completed");
        assert.equal(receipt.commands[0]?.basis, "attested");
        assert.equal(receipt.commands[0]?.raw_output_included, false);
        assert.match(
          receipt.commands[0]?.command_fingerprint ?? "",
          /^sha256:[a-f0-9]{64}$/,
        );
        const approvalResidue = receipt.host_approvals?.[0];
        assert(approvalResidue);
        assert.equal(receipt.host_approvals?.length, 1);
        assert.equal(approvalResidue.operation_class, "command_execution");
        assert.equal(
          approvalResidue.resource_summary,
          "Command scoped to the selected project root.",
        );
        assert.equal(approvalResidue.decision, "approve_once");
        assert.equal(
          approvalResidue.decision_source,
          "explicit_local_operator",
        );
        assert.equal(approvalResidue.coverage, "observed");
        assert.equal(approvalResidue.semantic_approval_created, false);
        assert.match(
          approvalResidue.request_fingerprint,
          /^sha256:[a-f0-9]{64}$/,
        );
        assert.match(
          approvalResidue.decision_fingerprint ?? "",
          /^sha256:[a-f0-9]{64}$/,
        );
        assert.equal(
          receipt.artifact_refs.some(
            (ref) => ref.external_id === "reports/live-result.json",
          ),
          true,
        );
        assert.equal(
          receipt.attestations.some(
            (attestation) =>
              attestation.attestation_kind === "native_host_artifact_report" &&
              attestation.summary === "Bounded fake result artifact.",
          ),
          true,
        );
        assert.equal(
          receipt.attestations.some(
            (attestation) =>
              attestation.attestation_kind === "native_host_action_report" &&
              attestation.summary === "fake_app_server_turn_completed" &&
              attestation.trust_class === "host_attestation",
          ),
          true,
        );
        assert.equal(
          receipt.attestations.some(
            (attestation) =>
              attestation.attestation_kind === "proposed_next_step" &&
              attestation.trust_class === "derived_interpretation",
          ),
          true,
        );
        assert.equal(resultDetail.packet.status, "available");
        if (resultDetail.criterion_assessment.status !== "available") {
          throw new Error("live_criterion_assessment_not_available");
        }
        materializeRunAssessmentProposalV01({
          packet: livePacket,
          receipt,
          assessment: resultDetail.criterion_assessment.assessment,
        });
        assert.equal(
          resultDetail.proposal.status,
          "available",
          JSON.stringify(resultDetail.proposal),
        );
        if (resultDetail.proposal.status !== "available") {
          throw new Error("live_run_assessment_proposal_not_available");
        }
        assert.equal(resultDetail.proposal.proposal_status, "pending_review");
        assert.equal(resultDetail.summary.mode, "interactive");
        assert.equal(resultDetail.summary.trust_label, "mixed");
        assert.equal(resultDetail.artifacts.length, 2);
        assert.equal(
          resultDetail.artifacts.some(
            (artifact) =>
              artifact.artifact_ref.external_id ===
                "reports/live-result.json" &&
              artifact.summary === "Bounded fake result artifact." &&
              artifact.basis === "attested",
          ),
          true,
        );
        assert.equal(resultDetail.actions.length >= 5, true);
        assert.equal(
          resultDetail.actions.some(
            (action) =>
              action.summary === "fake_app_server_turn_completed" &&
              action.basis === "host_attested",
          ),
          true,
        );
        assert.equal(
          resultDetail.actions.every(
            (action) => action.basis === "host_attested",
          ),
          true,
        );
        assert.equal(resultDetail.commands.length, 1);
        assert.equal(resultDetail.commands[0]?.summary, "npm test");
        assert.equal(resultDetail.commands[0]?.basis, "attested");
        assert.equal(resultDetail.host.approvals.length, 1);
        assert.equal(
          resultDetail.model_invocations.some(
            (entry) => entry.state === "native_host_internal_outside_coverage",
          ),
          true,
        );
        assert.equal(
          resultDetail.proposed_next_steps.every(
            (entry) => entry.basis === "advisory",
          ),
          true,
        );
        assert.equal(resultDetail.authority.review_decision_created, false);
        assert.equal(resultDetail.authority.semantic_transition_created, false);
        assert.equal(resultDetail.authority.evidence_accepted, false);
        assert.equal(resultDetail.authority.work_closed, false);
        const readResultRoute = createVNextOperatorRunResultReadHandlerV01({
          environment,
          clock,
        });
        const readResultResponse = await readResultRoute(
          routeRequest("/api/vnext/operator/run-results", {
            method: "GET",
            jar,
            query: { receipt_ref: receipt.receipt_id },
          }),
        );
        assert.equal(readResultResponse.status, 200);
        const readResultBody = await publicJson(readResultResponse);
        assert.equal(readResultBody.status, "result_detail");
        assert.deepEqual(readResultBody.result, resultDetail);
        assert.equal(readResultBody.proposal_created, false);
        assert.equal(readResultBody.review_decision_created, false);
        assert.equal(readResultBody.semantic_transition_created, false);
        assert.equal(readResultBody.evidence_accepted, false);
        assert.equal(readResultBody.work_closed, false);
        const unauthenticatedResultResponse = await readResultRoute(
          routeRequest("/api/vnext/operator/run-results", {
            method: "GET",
            query: { receipt_ref: receipt.receipt_id },
          }),
        );
        assert.equal(unauthenticatedResultResponse.status, 401);
        assert.equal(
          (await publicJson(unauthenticatedResultResponse)).error_code,
          "operator_session_cookie_missing",
        );
        const malformedResultResponse = await readResultRoute(
          routeRequest("/api/vnext/operator/run-results", {
            method: "GET",
            jar,
            query: { receipt_ref: "run-receipt:../private" },
          }),
        );
        assert.equal(malformedResultResponse.status, 400);
        assert.equal(
          (await publicJson(malformedResultResponse)).error_code,
          "run_result_ref_invalid",
        );
        const durable = canonicalizeProtocolValueV01({
          run,
          receipt,
          resultDetail,
        });
        assert.equal(
          durable.includes(operatorProjectRoot),
          false,
          "live durable material must omit the absolute project root",
        );
        assert.equal(
          durable.includes(input.packet.task.goal),
          false,
          "live durable material must omit the rendered packet goal",
        );
        assert.equal(
          durable.includes("raw output must never be persisted"),
          false,
          "live durable material must omit raw command output",
        );
        assert.equal(
          durable.includes("raw diff must never be persisted"),
          false,
          "live durable material must omit raw diffs",
        );
        assert.equal(
          durable.includes("not-returned-to-augnes@example.invalid"),
          false,
          "live durable material must omit account details",
        );
        assert.equal(
          durable.includes("OPENAI_API_KEY"),
          false,
          "live durable material must omit credential names and values",
        );

        const trace = readFakeTraceV01(harness.trace_path);
        assert.equal(countTraceMethodV01(trace, "initialize"), 1);
        assert.equal(countTraceMethodV01(trace, "account/read"), 1);
        assert.equal(countTraceMethodV01(trace, "thread/start"), 1);
        assert.equal(countTraceMethodV01(trace, "turn/start"), 1);
        const turnStart = trace.find(
          (entry) =>
            entry.kind === "received" && entry.value.method === "turn/start",
        );
        assert(turnStart);
        assert.equal(turnStart.value.cwd, operatorProjectRoot);
        assert.equal(turnStart.value.approval_policy, "on-request");
        assert.equal(turnStart.value.sandbox_policy?.type, "workspaceWrite");
        assert.deepEqual(turnStart.value.sandbox_policy?.writableRoots, [
          operatorProjectRoot,
        ]);
        assert.equal(turnStart.value.sandbox_policy?.networkAccess, false);
        assert.equal(turnStart.value.output_schema, true);
        assert(Number(turnStart.value.rendered_input_bytes) > 0);
        assert.match(
          String(turnStart.value.rendered_input_sha256),
          /^sha256:[a-f0-9]{64}$/,
        );
        assert.equal(
          harness.observations.filter((entry) => entry.kind === "spawned")
            .length,
          1,
        );
        assert.equal(
          harness.observations.filter((entry) => entry.kind === "settled")
            .length,
          1,
        );
        assertObservedProcessesStoppedV01(harness.observations);

        const terminalReplay = await harness.service.start({
          config,
          mode: "interactive",
        });
        assert.equal(terminalReplay.status, "exact_replay");
        assert.equal(
          terminalReplay.projection.receipt?.receipt_ref,
          projection.receipt.receipt_ref,
        );
        assert.equal(
          harness.observations.filter((entry) => entry.kind === "spawned")
            .length,
          1,
        );

        const reboundRoot = path.join(
          path.dirname(config.database_path),
          "terminal-replay-rebound-root",
        );
        mkdirSync(reboundRoot, { recursive: true, mode: 0o700 });
        const reboundDb = openVNextLocalOperatorDatabaseV01(config);
        try {
          rebindCanonicalProjectLocalRootV01(
            reboundDb,
            {
              workspace_id: config.workspace_id,
              project_id: config.project_id,
              local_root: normalizeLocalProjectRootRefV01(reboundRoot, {
                base_path: path.parse(reboundRoot).root,
              }),
            },
            { now: () => clock.now() },
          );
        } finally {
          reboundDb.close();
        }
        await assert.rejects(
          () =>
            harness.service.start({
              config,
              mode: "interactive",
            }),
          /live_host_start_conflict/,
        );
        assert.equal(
          harness.observations.filter((entry) => entry.kind === "spawned")
            .length,
          1,
        );
      } finally {
        await harness.service.shutdown();
      }
    },
  );
  pass("live_codex_golden_packet_thread_turn_approval_receipt_round_trip");
  pass("live_codex_route_uses_zero_copy_paste_or_internal_id_entry");
  pass("live_codex_packet_egress_and_r4_coverage_are_truthful_and_minimized");
  pass("live_codex_process_settles_before_one_canonical_receipt");
  reject("live_codex_terminal_replay_after_root_rebind_fails_closed");
}

async function assertLiveCodexApprovalReplayAndContainmentOnClonesV01(input: {
  environment: NodeJS.ProcessEnv;
  jar: RouteCookieJar;
  packet: TaskContextPacketV01;
}): Promise<void> {
  await withOperatorDatabaseCloneV01(
    "live-codex-file-approval-replay",
    input.environment,
    async ({ config, environment }) => {
      installPublicSafeLivePacketV01(config, input.packet);
      const clock = new ManualClock(
        addIsoMillisecondsV01(input.packet.generated_at, 31_500),
      );
      const harness = createFakeLiveCodexHarnessV01({
        config,
        scenario: "file_approval",
        now: () => clock.now(),
      });
      const post = createVNextOperatorHostRoundTripHandlerV01({
        environment,
        clock,
        secret_source: new DeterministicSecretSource(),
        live_service: harness.service,
      });
      const jar = cloneRouteCookieJarV01(input.jar);
      const authorityBefore = (() => {
        const db = openVNextLocalOperatorDatabaseV01(config);
        try {
          return countRowsByKind(db, "review_decision");
        } finally {
          db.close();
        }
      })();
      try {
        const credentialInjection = await post(
          routeRequest("/api/vnext/operator/host-round-trip", {
            method: "POST",
            jar,
            body: {
              action: "start_live",
              OPENAI_API_KEY: "forbidden-route-material",
            },
          }),
        );
        assert.equal(credentialInjection.status, 400);
        assert.equal(
          (await publicJson(credentialInjection)).error_code,
          "live_host_action_body_invalid",
        );

        const start = await harness.service.start({
          config,
          mode: "interactive",
        });
        assert.equal(start.status, "accepted");
        let projection: LiveNativeHostRunProjectionV01;
        try {
          projection = await waitForLiveProjectionV01(
            harness.service,
            config,
            (value) => value.status === "waiting_for_approval",
          );
        } catch (error) {
          throw new Error(
            `file_approval_request:${error instanceof Error ? error.message : "failed"}:trace=${JSON.stringify(readFakeTraceV01(harness.trace_path).slice(-32))}`,
          );
        }
        assert(projection.pending_approval);
        assert.equal(
          projection.pending_approval.operation_class,
          "file_change",
        );
        assert.deepEqual(
          projection.pending_approval.repository_relative_paths,
          ["src"],
        );
        assert.equal(projection.receipt, null);

        const pending = projection.pending_approval;
        const stale = await post(
          routeRequest("/api/vnext/operator/host-round-trip", {
            method: "POST",
            jar,
            body: {
              action: "decline",
              run_ref: projection.run_ref,
              approval_ref: pending.approval_ref,
              control_revision: pending.control_revision + 1,
            },
          }),
        );
        assert.equal(stale.status, 409);

        const decline = await post(
          routeRequest("/api/vnext/operator/host-round-trip", {
            method: "POST",
            jar,
            body: {
              action: "decline",
              run_ref: projection.run_ref,
              approval_ref: pending.approval_ref,
              control_revision: pending.control_revision,
            },
          }),
        );
        assert.equal(decline.status, 200);
        jar.absorb(decline);

        const exactReplay = await post(
          routeRequest("/api/vnext/operator/host-round-trip", {
            method: "POST",
            jar,
            body: {
              action: "decline",
              run_ref: projection.run_ref,
              approval_ref: pending.approval_ref,
              control_revision: pending.control_revision,
            },
          }),
        );
        assert.equal(exactReplay.status, 200);
        jar.absorb(exactReplay);

        const conflict = await post(
          routeRequest("/api/vnext/operator/host-round-trip", {
            method: "POST",
            jar,
            body: {
              action: "approve_once",
              run_ref: projection.run_ref,
              approval_ref: pending.approval_ref,
              control_revision: pending.control_revision,
            },
          }),
        );
        assert.equal(conflict.status, 409);
        assert.equal(
          (await publicJson(conflict)).error_code,
          "live_host_approval_decision_conflict",
        );

        try {
          projection = await waitForLiveProjectionV01(
            harness.service,
            config,
            (value) => value.status === "failed",
          );
        } catch (error) {
          throw new Error(
            `file_approval_completion:${error instanceof Error ? error.message : "failed"}:observations=${JSON.stringify(harness.observations)}:trace=${JSON.stringify(readFakeTraceV01(harness.trace_path).slice(-32))}`,
          );
        }
        assert(projection.receipt);
        const run = readHostRunStateFromConfigV01(config, projection.run_ref!);
        const decisions = Array.isArray(run.metadata.approval_decisions)
          ? run.metadata.approval_decisions
          : [];
        assert.equal(decisions.length, 1);
        assert.equal(decisions[0]?.decision, "decline");
        assert.equal(decisions[0]?.decision_source, "explicit_local_operator");
        const authorityDb = openVNextLocalOperatorDatabaseV01(config);
        try {
          assert.equal(
            countRowsByKind(authorityDb, "review_decision"),
            authorityBefore,
          );
        } finally {
          authorityDb.close();
        }
        assert.equal(readNetworkAttemptsV01(harness.network_count_path), 0);
        assertObservedProcessesStoppedV01(harness.observations);
      } finally {
        await harness.service.shutdown();
      }
    },
  );

  await withOperatorDatabaseCloneV01(
    "live-codex-expired-approval",
    input.environment,
    async ({ config, environment }) => {
      installPublicSafeLivePacketV01(config, input.packet);
      const clock = new ManualClock(
        addIsoMillisecondsV01(input.packet.generated_at, 31_750),
      );
      const harness = createFakeLiveCodexHarnessV01({
        config,
        scenario: "command_approval",
        now: () => clock.now(),
      });
      const post = createVNextOperatorHostRoundTripHandlerV01({
        environment,
        clock,
        secret_source: new DeterministicSecretSource(),
        live_service: harness.service,
      });
      const jar = cloneRouteCookieJarV01(input.jar);
      try {
        const start = await harness.service.start({
          config,
          mode: "interactive",
        });
        assert.equal(start.status, "accepted");
        let projection: LiveNativeHostRunProjectionV01;
        try {
          projection = await waitForLiveProjectionV01(
            harness.service,
            config,
            (value) => value.status === "waiting_for_approval",
          );
        } catch (error) {
          throw new Error(
            `expiring_approval_request:${error instanceof Error ? error.message : "failed"}:trace=${JSON.stringify(readFakeTraceV01(harness.trace_path).slice(-32))}`,
          );
        }
        const pending = projection.pending_approval!;
        assert(pending.expires_at);
        clock.set(addIsoMillisecondsV01(pending.expires_at, 1));
        const expired = await post(
          routeRequest("/api/vnext/operator/host-round-trip", {
            method: "POST",
            jar,
            body: {
              action: "approve_once",
              run_ref: projection.run_ref,
              approval_ref: pending.approval_ref,
              control_revision: pending.control_revision,
            },
          }),
        );
        assert.equal(expired.status, 409);
        assert.equal(
          (await publicJson(expired)).error_code,
          "live_host_approval_expired",
        );
        assert.equal(
          harness.service.read(config).status,
          "waiting_for_approval",
        );
        await harness.service.shutdown();
        try {
          projection = harness.service.read(config);
          assert.equal(projection.status, "cancelled");
        } catch (error) {
          throw new Error(
            `expired_approval_cancel:${error instanceof Error ? error.message : "failed"}:trace=${JSON.stringify(readFakeTraceV01(harness.trace_path).slice(-32))}`,
          );
        }
        assert(projection.receipt);
      } finally {
        await harness.service.shutdown();
      }
    },
  );
  pass(
    "live_codex_file_approval_is_contained_and_user_decision_replay_is_idempotent",
  );
  pass("live_codex_explicit_decline_stops_the_same_turn_truthfully");
  reject(
    "live_codex_stale_expired_mismatched_and_conflicting_approval_decisions_refused",
  );
  reject(
    "live_codex_routes_reject_provider_credentials_and_arbitrary_launch_material",
  );
  pass(
    "live_codex_host_approval_creates_no_review_decision_or_semantic_transition",
  );
}

async function assertLiveCodexPolicyApprovalParityOnClonesV01(input: {
  environment: NodeJS.ProcessEnv;
  packet: TaskContextPacketV01;
}): Promise<void> {
  await withOperatorDatabaseCloneV01(
    "live-codex-policy-network-grant",
    input.environment,
    async ({ config }) => {
      const clock = new ManualClock(
        addIsoMillisecondsV01(input.packet.generated_at, 32_000),
      );
      const automation = directHostPolicyContextV01(clock.now());
      installPolicySafeLivePacketV01(config, input.packet, automation, {
        approval_capabilities: ["native_host_approval:network_permission"],
        resources: [
          "https://api.example.invalid",
          `command:${createProtocolSha256V01("npm test")}`,
        ],
        expires_at: addIsoMillisecondsV01(clock.now(), 60_000),
      });
      const harness = createFakeLiveCodexHarnessV01({
        config,
        scenario: "command_network_approval",
        now: () => clock.now(),
      });
      try {
        const started = await harness.service.start({
          config,
          mode: "policy_triggered",
          automation_context: automation,
        });
        assert.equal(started.status, "accepted");
        const projection = await waitForLiveProjectionV01(
          harness.service,
          config,
          (value) => value.status === "completed",
        );
        assert(projection.receipt);
        assert.equal(projection.mode, "policy_triggered");
        const run = readHostRunStateFromConfigV01(config, projection.run_ref!);
        const decisions = run.metadata.approval_decisions as Array<
          Record<string, unknown>
        >;
        assert.equal(decisions.length, 1);
        assert.equal(decisions[0]?.decision, "approve_once");
        assert.equal(decisions[0]?.decision_source, "bounded_capability_grant");
        const resultDb = openVNextLocalOperatorDatabaseV01(config);
        const resultDetail = readProjectRunResultDetailV01(resultDb, {
          workspace_id: config.workspace_id,
          project_id: config.project_id,
          receipt_id: projection.receipt.receipt_ref,
        });
        resultDb.close();
        assert.equal(resultDetail.summary.mode, "policy_triggered");
        assert.equal(resultDetail.host.approvals.length, 1);
        assert.equal(
          resultDetail.host.approvals[0]?.decision_source,
          "bounded_capability_grant",
        );
        assert.equal(resultDetail.host.approvals[0]?.coverage, "enforced");
        assert.equal(
          resultDetail.host.approvals[0]?.semantic_approval_created,
          false,
        );
        assert.equal(resultDetail.authority.review_decision_created, false);
        assert.equal(resultDetail.authority.semantic_state_changed, false);
        assert.equal(readNetworkAttemptsV01(harness.network_count_path), 0);
        assertObservedProcessesStoppedV01(harness.observations);
      } finally {
        await harness.service.shutdown();
      }
    },
  );

  await withOperatorDatabaseCloneV01(
    "live-codex-policy-uncovered-network",
    input.environment,
    async ({ config }) => {
      const clock = new ManualClock(
        addIsoMillisecondsV01(input.packet.generated_at, 32_250),
      );
      const automation = directHostPolicyContextV01(clock.now());
      installPolicySafeLivePacketV01(config, input.packet, automation, {
        approval_capabilities: [],
        resources: [],
        expires_at: addIsoMillisecondsV01(clock.now(), 60_000),
      });
      const harness = createFakeLiveCodexHarnessV01({
        config,
        scenario: "network_permission_approval_ignored_interrupt",
        now: () => clock.now(),
      });
      const receiptsBefore = countRunReceiptsV01(config);
      await harness.service.start({
        config,
        mode: "policy_triggered",
        automation_context: automation,
      });
      const waiting = await waitForLiveProjectionV01(
        harness.service,
        config,
        (value) => value.status === "waiting_for_approval",
      );
      assert.equal(
        waiting.pending_approval?.operation_class,
        "network_permission",
      );
      assert.deepEqual(waiting.pending_approval?.network_resources, []);
      assert.deepEqual(waiting.pending_approval?.available_decisions, [
        "decline",
        "cancel_run",
      ]);
      assert.equal(waiting.pending_approval?.decision_submitted, false);
      assert.equal(countRunReceiptsV01(config), receiptsBefore);
      await assert.rejects(
        () =>
          harness.service.start({
            config,
            mode: "policy_triggered",
            automation_context: {
              ...automation,
              control_revision: 1,
            },
          }),
        /live_host_start_conflict/,
      );
      await harness.service.shutdown();
      const stopped = harness.service.read(config);
      assert.equal(stopped.status, "paused");
      assert.equal(stopped.reconciliation_required, true);
      assert.equal(stopped.receipt, null);
      assert.equal(countRunReceiptsV01(config), receiptsBefore);
      assert.equal(
        countTraceMethodV01(
          readFakeTraceV01(harness.trace_path),
          "turn/interrupt",
        ),
        1,
      );
      assert.equal(readNetworkAttemptsV01(harness.network_count_path), 0);
      assertObservedProcessesStoppedV01(harness.observations);
    },
  );

  await withOperatorDatabaseCloneV01(
    "live-codex-policy-expired-grant",
    input.environment,
    async ({ config }) => {
      const clock = new ManualClock(
        addIsoMillisecondsV01(input.packet.generated_at, 32_500),
      );
      const automation = directHostPolicyContextV01(clock.now());
      installPolicySafeLivePacketV01(config, input.packet, automation, {
        approval_capabilities: ["native_host_approval:network_permission"],
        resources: [
          "https://api.example.invalid",
          `command:${createProtocolSha256V01("npm test")}`,
        ],
        expires_at: addIsoMillisecondsV01(clock.now(), -1),
      });
      const harness = createFakeLiveCodexHarnessV01({
        config,
        scenario: "command_network_approval",
        now: () => clock.now(),
      });
      const receiptsBefore = countRunReceiptsV01(config);
      try {
        await assert.rejects(
          () =>
            harness.service.start({
              config,
              mode: "policy_triggered",
              automation_context: automation,
            }),
          /direct_host_(?:live_capability_grant_required|packet_invalid)/,
        );
        assert.equal(harness.observations.length, 0);
        assert.equal(countRunReceiptsV01(config), receiptsBefore);
      } finally {
        await harness.service.shutdown();
      }
    },
  );
  pass(
    "live_codex_interactive_and_policy_modes_share_lifecycle_and_approval_service",
  );
  pass(
    "live_codex_exact_current_policy_grant_approves_once_without_fabricating_user_decision",
  );
  reject("live_codex_uncovered_or_expired_network_grant_never_auto_approves");
  reject("live_codex_active_replay_with_mode_or_policy_drift_fails_closed");
}

async function assertLiveCodexCancellationSettlementOnCloneV01(input: {
  environment: NodeJS.ProcessEnv;
  jar: RouteCookieJar;
  packet: TaskContextPacketV01;
}): Promise<void> {
  await withOperatorDatabaseCloneV01(
    "live-codex-cancel-settlement",
    input.environment,
    async ({ config, environment }) => {
      installPublicSafeLivePacketV01(config, input.packet);
      const clock = new ManualClock(
        addIsoMillisecondsV01(input.packet.generated_at, 32_000),
      );
      const harness = createFakeLiveCodexHarnessV01({
        config,
        scenario: "delayed_cleanup",
        now: () => clock.now(),
        controlled_cleanup: true,
        stop_settle_timeout_ms: 10_000,
      });
      const post = createVNextOperatorHostRoundTripHandlerV01({
        environment,
        clock,
        secret_source: new DeterministicSecretSource(),
        live_service: harness.service,
      });
      const jar = cloneRouteCookieJarV01(input.jar);
      const receiptsBefore = countRunReceiptsV01(config);
      try {
        const start = await post(
          routeRequest("/api/vnext/operator/host-round-trip", {
            method: "POST",
            jar,
            body: { action: "start_live" },
          }),
        );
        jar.absorb(start);
        let projection: LiveNativeHostRunProjectionV01;
        try {
          projection = await waitForLiveProjectionV01(
            harness.service,
            config,
            (value) => value.status === "waiting_for_approval",
            10_000,
            "cancel_waiting_gate",
          );
        } catch (error) {
          throw new Error(
            `cancel_waiting_gate:${error instanceof Error ? error.message : "failed"}:observations=${JSON.stringify(harness.observations)}:trace=${JSON.stringify(readFakeTraceV01(harness.trace_path).slice(-32))}`,
          );
        }
        assert(projection.run_ref);
        const cancellationRequestRevision = projection.control_revision;
        const conflictingCancellation = await post(
          routeRequest("/api/vnext/operator/host-round-trip", {
            method: "POST",
            jar,
            body: {
              action: "cancel",
              run_ref: projection.run_ref,
              control_revision: cancellationRequestRevision + 100,
            },
          }),
        );
        assert.equal(conflictingCancellation.status, 409);
        assert.equal(
          harness.service.read(config).status,
          "waiting_for_approval",
        );
        assert.equal(
          countTraceMethodV01(
            readFakeTraceV01(harness.trace_path),
            "turn/interrupt",
          ),
          0,
        );
        const cancel = await post(
          routeRequest("/api/vnext/operator/host-round-trip", {
            method: "POST",
            jar,
            body: {
              action: "cancel",
              run_ref: projection.run_ref,
              control_revision: cancellationRequestRevision,
            },
          }),
        );
        assert.equal(cancel.status, 200);
        jar.absorb(cancel);
        await waitForFakeTraceMethodV01(harness.trace_path, "turn/interrupt");
        projection = harness.service.read(config);
        assert.equal(projection.status, "cancelling");
        assert.equal(projection.receipt, null);
        assert.equal(countRunReceiptsV01(config), receiptsBefore);
        assert.equal(existsSync(harness.cleanup_marker_path), false);
        writeFileSync(harness.release_path!, "release\n", { mode: 0o600 });
        try {
          projection = await waitForLiveProjectionV01(
            harness.service,
            config,
            (value) => value.status === "cancelled",
          );
        } catch (error) {
          throw new Error(
            `${error instanceof Error ? error.message : "live_cancel_failed"}:trace=${JSON.stringify(readFakeTraceV01(harness.trace_path).slice(-40))}`,
          );
        }
        assert(projection.receipt);
        assert.equal(
          existsSync(harness.cleanup_marker_path),
          true,
          `live_cancel_cleanup_marker_missing:${readFakeTraceV01(
            harness.trace_path,
          )
            .map((entry) => entry.kind)
            .join(",")}`,
        );
        assert.equal(countRunReceiptsV01(config), receiptsBefore + 1);
        assert.equal(
          countTraceMethodV01(
            readFakeTraceV01(harness.trace_path),
            "turn/interrupt",
          ),
          1,
        );
        assertObservedProcessesStoppedV01(harness.observations);

        const replay = await post(
          routeRequest("/api/vnext/operator/host-round-trip", {
            method: "POST",
            jar,
            body: {
              action: "cancel",
              run_ref: projection.run_ref!,
              control_revision: projection.control_revision,
            },
          }),
        );
        assert.equal(replay.status, 200);
        jar.absorb(replay);
        assert.equal(countRunReceiptsV01(config), receiptsBefore + 1);
        assert.equal(readNetworkAttemptsV01(harness.network_count_path), 0);
      } finally {
        if (!existsSync(harness.release_path ?? "")) {
          if (harness.release_path)
            writeFileSync(harness.release_path, "release\n");
        }
        await harness.service.shutdown();
      }
    },
  );
  pass("live_codex_cancel_interrupts_exact_turn_and_waits_for_cleanup_barrier");
  pass("live_codex_repeated_cancel_is_idempotent_with_one_receipt");
}

async function assertLiveCodexTimeoutSettlementOnCloneV01(input: {
  environment: NodeJS.ProcessEnv;
  packet: TaskContextPacketV01;
}): Promise<void> {
  await withOperatorDatabaseCloneV01(
    "live-codex-timeout-settlement",
    input.environment,
    async ({ config }) => {
      installPublicSafeLivePacketV01(config, input.packet);
      const clock = new ManualClock(
        addIsoMillisecondsV01(input.packet.generated_at, 32_625),
      );
      const harness = createFakeLiveCodexHarnessV01({
        config,
        scenario: "command_approval",
        now: () => clock.now(),
        timeout_ms: 30_000,
        stop_settle_timeout_ms: 2_000,
        controlled_timeout: true,
      });
      const receiptsBefore = countRunReceiptsV01(config);
      try {
        await harness.service.start({ config, mode: "interactive" });
        await waitForLiveProjectionV01(
          harness.service,
          config,
          (value) =>
            value.status === "waiting_for_approval" &&
            value.pending_approval !== null,
          10_000,
          "timeout_host_ready",
        );
        assert.equal(countRunReceiptsV01(config), receiptsBefore);
        assert(harness.trigger_timeout);
        assert.equal(harness.timeout_schedule_active(), true);
        clock.set(addIsoMillisecondsV01(clock.now(), 30_000));
        harness.trigger_timeout();
        const projection = await waitForLiveProjectionV01(
          harness.service,
          config,
          (value) =>
            value.status === "timed_out" &&
            value.receipt?.outcome === "timed_out",
          10_000,
          "timeout_terminal",
        );
        assert(projection.receipt);
        assert.equal(harness.timeout_schedule_active(), false);
        assert.equal(countRunReceiptsV01(config), receiptsBefore + 1);
        assert.equal(
          countTraceMethodV01(
            readFakeTraceV01(harness.trace_path),
            "turn/interrupt",
          ),
          1,
        );
        assert.equal(existsSync(harness.cleanup_marker_path), true);
        const run = readHostRunStateFromConfigV01(config, projection.run_ref!);
        const cancellationDecision = (
          Array.isArray(run.metadata.approval_decisions)
            ? (run.metadata.approval_decisions as Array<
                Record<string, unknown>
              >)
            : []
        ).find(
          (decision) =>
            decision.decision === "cancel_run" &&
            decision.decision_source === "run_cancellation",
        );
        const approvalResolutionObserved = run.events.some(
          (event) =>
            event.event_type === "host_event_observed" &&
            event.payload.event_kind === "approval_resolved",
        );
        assert.equal(run.metadata.pending_approval, null);
        assert.equal(
          Boolean(cancellationDecision) ||
            approvalResolutionObserved ||
            run.metadata.pending_approval_abandoned_by_terminal_stop === true,
          true,
        );
        assert.equal(readNetworkAttemptsV01(harness.network_count_path), 0);
        assertObservedProcessesStoppedV01(harness.observations);
      } finally {
        await harness.service.shutdown();
      }
    },
  );
  pass("live_codex_timeout_interrupts_once_and_receipts_only_after_settlement");
}

async function assertLiveCodexRuntimeShutdownAndDescendantCleanupOnCloneV01(input: {
    environment: NodeJS.ProcessEnv;
    packet: TaskContextPacketV01;
}): Promise<void> {
  await withOperatorDatabaseCloneV01(
    "live-codex-runtime-shutdown-descendant",
    input.environment,
    async ({ config }) => {
      installPublicSafeLivePacketV01(config, input.packet);
      const clock = new ManualClock(
        addIsoMillisecondsV01(input.packet.generated_at, 32_750),
      );
      const harness = createFakeLiveCodexHarnessV01({
        config,
        scenario: "descendant_cleanup",
        now: () => clock.now(),
      });
      const accepted = await harness.service.start({
        config,
        mode: "interactive",
      });
      assert.equal(accepted.status, "accepted");
      const waiting = await waitForLiveProjectionV01(
        harness.service,
        config,
        (value) => value.status === "waiting_for_approval",
      );
      assert(waiting.run_ref);
      const spawned = harness.observations.find(
        (entry) => entry.kind === "spawned",
      );
      assert(spawned?.process_id);
      assert.doesNotThrow(() => process.kill(spawned.process_id!, 0));
      const descendant = readFakeTraceV01(harness.trace_path).find(
        (entry) => entry.kind === "descendant_started",
      )?.value.pid;
      assert.equal(typeof descendant, "number");
      assert.doesNotThrow(() => process.kill(Number(descendant), 0));

      await harness.service.shutdown();
      const projection = harness.service.read(config);
      assert.equal(projection.status, "cancelled");
      assert(projection.receipt);
      assert.equal(existsSync(harness.cleanup_marker_path), true);
      assertObservedProcessesStoppedV01(harness.observations);
      assert.throws(
        () => process.kill(Number(descendant), 0),
        /ESRCH|EPERM|kill ESRCH/,
      );
      assert.equal(readNetworkAttemptsV01(harness.network_count_path), 0);
    },
  );
  pass(
    "live_codex_registered_runtime_owner_stops_full_child_process_tree_on_shutdown",
  );
  pass("live_codex_route_acceptance_does_not_orphan_owned_app_server_work");
}

async function assertLiveCodexDisconnectResumeOnCloneV01(input: {
  environment: NodeJS.ProcessEnv;
  jar: RouteCookieJar;
  packet: TaskContextPacketV01;
}): Promise<void> {
  await withOperatorDatabaseCloneV01(
    "live-codex-disconnect-resume",
    input.environment,
    async ({ config, environment }) => {
      installPublicSafeLivePacketV01(config, input.packet);
      const clock = new ManualClock(
        addIsoMillisecondsV01(input.packet.generated_at, 33_000),
      );
      const harness = createFakeLiveCodexHarnessV01({
        config,
        scenario: "disconnect_resume",
        now: () => clock.now(),
      });
      const post = createVNextOperatorHostRoundTripHandlerV01({
        environment,
        clock,
        secret_source: new DeterministicSecretSource(),
        live_service: harness.service,
      });
      const jar = cloneRouteCookieJarV01(input.jar);
      const receiptsBefore = countRunReceiptsV01(config);
      try {
        const start = await post(
          routeRequest("/api/vnext/operator/host-round-trip", {
            method: "POST",
            jar,
            body: { action: "start_live" },
          }),
        );
        jar.absorb(start);
        let projection = await waitForLiveProjectionV01(
          harness.service,
          config,
          (value) => value.status === "paused",
        );
        assert.equal(projection.reconciliation_required, true);
        assert.equal(projection.receipt, null);
        assert.equal(countRunReceiptsV01(config), receiptsBefore);
        const unownedCancel = await post(
          routeRequest("/api/vnext/operator/host-round-trip", {
            method: "POST",
            jar,
            body: {
              action: "cancel",
              run_ref: projection.run_ref!,
              control_revision: projection.control_revision,
            },
          }),
        );
        assert.equal(unownedCancel.status, 409);
        assert.equal(
          (await publicJson(unownedCancel)).error_code,
          "live_host_cancel_owner_unavailable",
        );
        assert.equal(countRunReceiptsV01(config), receiptsBefore);
        const resume = await post(
          routeRequest("/api/vnext/operator/host-round-trip", {
            method: "POST",
            jar,
            body: {
              action: "resume",
              run_ref: projection.run_ref!,
              control_revision: projection.control_revision,
            },
          }),
        );
        assert.equal(resume.status, 202);
        jar.absorb(resume);
        try {
          projection = await waitForLiveProjectionV01(
            harness.service,
            config,
            (value) => value.status === "completed",
          );
        } catch (error) {
          throw new Error(
            `${error instanceof Error ? error.message : "live_resume_failed"}:trace=${JSON.stringify(readFakeTraceV01(harness.trace_path).slice(-40))}`,
          );
        }
        assert(projection.receipt);
        assert.equal(countRunReceiptsV01(config), receiptsBefore + 1);
        const trace = readFakeTraceV01(harness.trace_path);
        assert.equal(countTraceMethodV01(trace, "initialize"), 2);
        assert.equal(countTraceMethodV01(trace, "thread/start"), 1);
        assert.equal(countTraceMethodV01(trace, "turn/start"), 1);
        assert.equal(countTraceMethodV01(trace, "thread/read"), 1);
        assert.equal(countTraceMethodV01(trace, "thread/resume"), 1);
        assertObservedProcessesStoppedV01(harness.observations);
        assert.equal(readNetworkAttemptsV01(harness.network_count_path), 0);
      } finally {
        await harness.service.shutdown();
      }
    },
  );
  pass("live_codex_disconnect_pauses_without_receipt_and_resumes_known_thread");
  pass("live_codex_resume_creates_no_second_thread_or_turn");
  reject("live_codex_disconnected_run_cannot_claim_cancel_without_host_owner");
}

async function assertLiveCodexFailureMatrixOnClonesV01(input: {
  environment: NodeJS.ProcessEnv;
  packet: TaskContextPacketV01;
}): Promise<void> {
  const cases = [
    ["ignored_interrupt", "paused", false],
    ["unauthenticated", "blocked", true],
    ["unsupported_app_server", "blocked", true],
    ["init_failure", "failed", true],
    ["malformed_json", "failed", true],
    ["oversized_jsonl", "failed", true],
    ["invalid_response_envelope", "failed", true],
    ["conflicting_duplicate_response", "failed", true],
    ["mismatched_response_id", "failed", true],
    ["mismatched_thread_approval", "paused", false],
    ["mismatched_turn_approval", "paused", false],
    ["file_approval_unsafe", "paused", false],
    ["unknown_approval_method", "paused", false],
    ["thread_status_unsupported", "paused", false],
    ["conflicting_completion", "paused", false],
    ["crash_before_thread_id", "paused", false],
    ["crash_after_thread_id", "paused", false],
    ["structured_result_invalid", "failed", true],
    ["structured_result_oversized", "failed", true],
    ["structured_result_unsafe_path", "failed", true],
    ["structured_result_private_path_text", "failed", true],
    ["structured_result_credential_text", "failed", true],
    ["duplicate_event", "completed", true],
  ] as const;

  for (const [scenario, expectedStatus, expectsReceipt] of cases) {
    await withOperatorDatabaseCloneV01(
      `live-codex-${scenario}`,
      input.environment,
      async ({ config }) => {
        installPublicSafeLivePacketV01(config, input.packet);
        const clock = new ManualClock(
          addIsoMillisecondsV01(input.packet.generated_at, 34_000),
        );
        const harness = createFakeLiveCodexHarnessV01({
          config,
          scenario,
          now: () => clock.now(),
          timeout_ms: scenario === "ignored_interrupt" ? 2_000 : 5_000,
          stop_settle_timeout_ms:
            scenario === "ignored_interrupt" ? 300 : 2_000,
        });
        const receiptsBefore = countRunReceiptsV01(config);
        try {
          await harness.service.start({ config, mode: "interactive" });
          let projection: LiveNativeHostRunProjectionV01;
          try {
            projection = await waitForLiveProjectionV01(
              harness.service,
              config,
              (value) => value.status === expectedStatus,
            );
          } catch (error) {
            throw new Error(
              `live_matrix_${scenario}:${error instanceof Error ? error.message : "projection_failed"}:trace=${JSON.stringify(readFakeTraceV01(harness.trace_path).slice(-24))}`,
            );
          }
          assert.equal(Boolean(projection.receipt), expectsReceipt);
          if (scenario === "unsupported_app_server") {
            assert.equal(
              projection.capability.public_reason,
              "codex_required_method_unavailable",
            );
          }
          if (scenario === "unauthenticated") {
            assert.equal(
              projection.capability.public_reason,
              "codex_not_authenticated",
            );
          }
          if (scenario === "init_failure") {
            assert.equal(projection.capability.status, "unavailable");
            assert.equal(
              projection.capability.public_reason,
              "codex_initialization_failed",
            );
          }
          assert.equal(
            countRunReceiptsV01(config),
            receiptsBefore + (expectsReceipt ? 1 : 0),
          );
          const run = readHostRunStateFromConfigV01(
            config,
            projection.run_ref!,
          );
          const durable = canonicalizeProtocolValueV01(run);
          assert.equal(durable.includes(operatorProjectRoot), false);
          assert.equal(durable.includes(input.packet.task.goal), false);
          assert.equal(
            durable.includes("not-returned-to-augnes@example.invalid"),
            false,
          );
          assert.equal(
            durable.includes("/Users/private/project/file.ts"),
            false,
          );
          assert.equal(durable.includes("sk-not-returned-to-augnes"), false);
          assert.equal(durable.includes("{malformed"), false);
          await harness.service.shutdown();
          assert.equal(harness.service.read(config).status, expectedStatus);
          assert.equal(readNetworkAttemptsV01(harness.network_count_path), 0);
          assertObservedProcessesStoppedV01(harness.observations, scenario);
        } finally {
          await harness.service.shutdown();
        }
      },
    );
  }

  await withOperatorDatabaseCloneV01(
    "live-codex-executable-absent",
    input.environment,
    async ({ config }) => {
      installPublicSafeLivePacketV01(config, input.packet);
      const clock = new ManualClock(
        addIsoMillisecondsV01(input.packet.generated_at, 35_000),
      );
      const harness = createFakeLiveCodexHarnessV01({
        config,
        scenario: "success",
        now: () => clock.now(),
        command: path.join(tempRoot, "definitely-missing-codex"),
      });
      try {
        await harness.service.start({ config, mode: "interactive" });
        const projection = await waitForLiveProjectionV01(
          harness.service,
          config,
          (value) => value.status === "blocked",
        );
        assert.equal(projection.capability.status, "unavailable");
        assert.equal(
          projection.capability.public_reason,
          "codex_executable_absent",
        );
      } finally {
        await harness.service.shutdown();
      }
    },
  );
  pass(
    "live_codex_capability_absence_and_auth_failure_are_truthful_and_optional",
  );
  reject(
    "live_codex_rpc_malformed_oversized_conflicting_and_mismatched_material_refused",
  );
  reject(
    "live_codex_cross_thread_turn_unknown_approval_and_ambiguous_start_fail_closed",
  );
  reject(
    "live_codex_invalid_oversized_and_path_unsafe_structured_results_not_persisted_raw",
  );
  pass("live_codex_unconfirmed_interrupt_pauses_without_terminal_receipt");
  pass("live_codex_fake_app_server_external_calls_zero_and_processes_settled");
  pass("live_codex_duplicate_lifecycle_event_is_idempotent");
}

function createFakeLiveCodexHarnessV01(input: {
  config: VNextLocalOperatorPilotConfigV01;
  scenario: string;
  now: () => string;
  timeout_ms?: number;
  stop_settle_timeout_ms?: number;
  controlled_cleanup?: boolean;
  controlled_timeout?: boolean;
  command?: string;
}): {
  service: LiveNativeHostRunServiceV01;
  observations: CodexAppServerAdapterObservationV01[];
  trace_path: string;
  state_path: string;
  cleanup_marker_path: string;
  network_count_path: string;
  release_path: string | null;
  trigger_timeout: (() => void) | null;
  timeout_schedule_active: () => boolean;
} {
  liveFixtureSequenceV01 += 1;
  const root = path.join(
    tempRoot,
    `live-codex-${liveFixtureSequenceV01}-${input.scenario}`,
  );
  const home = path.join(root, "home");
  const runtime = path.join(root, "runtime");
  mkdirSync(home, { recursive: true });
  mkdirSync(runtime, { recursive: true });
  const tracePath = path.join(runtime, "trace.jsonl");
  const statePath = path.join(runtime, "state.json");
  const cleanupMarkerPath = path.join(runtime, "cleanup.marker");
  const networkCountPath = path.join(runtime, "network-count.txt");
  const approvalResolutionBarrierPath = path.join(
    runtime,
    "approval-resolution-count.txt",
  );
  const releasePath = input.controlled_cleanup
    ? path.join(runtime, "release.marker")
    : null;
  let scheduledTimeoutCallback: (() => void) | null = null;
  let timeoutTriggered = false;
  const observations: CodexAppServerAdapterObservationV01[] = [];
  const service = new LiveNativeHostRunServiceV01({
    now: input.now,
    test_only_allow_unauthenticated_interactive: true,
    timeout_ms: input.timeout_ms ?? 30_000,
    stop_settle_timeout_ms: input.stop_settle_timeout_ms ?? 3_000,
    ...(input.controlled_timeout
      ? {
          schedule_timeout: ({
            timeout_ms,
            on_timeout,
          }: {
            timeout_ms: number;
            on_timeout: () => void;
          }) => {
            assert.equal(timeout_ms, input.timeout_ms ?? 30_000);
            assert.equal(scheduledTimeoutCallback, null);
            scheduledTimeoutCallback = on_timeout;
            return () => {
              if (scheduledTimeoutCallback === on_timeout) {
                scheduledTimeoutCallback = null;
              }
            };
          },
        }
      : {}),
    adapter_factory: () =>
      createCodexAppServerAdapterV01({
        now: input.now,
        observe: (observation) => {
          observations.push(observation);
          if (observation.kind === "approval_resolved") {
            writeFileSync(
              approvalResolutionBarrierPath,
              `${
                observations.filter(
                  (candidate) => candidate.kind === "approval_resolved",
                ).length
              }\n`,
              { mode: 0o600 },
            );
          }
        },
        launch: {
          command: input.command ?? process.execPath,
          prefix_args: input.command
            ? []
            : [
                path.join(
                  process.cwd(),
                  "scripts",
                  "fixtures",
                  "fake-codex-app-server.mjs",
                ),
              ],
          environment: {
            NODE_ENV: "test",
            HOME: home,
            TMPDIR: runtime,
            PATH: process.env.PATH,
            FAKE_CODEX_SCENARIO: input.scenario,
            FAKE_CODEX_STATE_PATH: statePath,
            FAKE_CODEX_TRACE_PATH: tracePath,
            FAKE_CODEX_CLEANUP_MARKER_PATH: cleanupMarkerPath,
            FAKE_CODEX_NETWORK_COUNT_PATH: networkCountPath,
            FAKE_CODEX_APPROVAL_RESOLUTION_BARRIER_PATH:
              approvalResolutionBarrierPath,
            ...(releasePath ? { FAKE_CODEX_RELEASE_PATH: releasePath } : {}),
          },
        },
      }),
  });
  return {
    service,
    observations,
    trace_path: tracePath,
    state_path: statePath,
    cleanup_marker_path: cleanupMarkerPath,
    network_count_path: networkCountPath,
    release_path: releasePath,
    trigger_timeout: input.controlled_timeout
      ? () => {
          assert.equal(timeoutTriggered, false);
          assert(scheduledTimeoutCallback);
          timeoutTriggered = true;
          scheduledTimeoutCallback();
        }
      : null,
    timeout_schedule_active: () => scheduledTimeoutCallback !== null,
  };
}

function installPublicSafeLivePacketV01(
  config: VNextLocalOperatorPilotConfigV01,
  source: TaskContextPacketV01,
): TaskContextPacketV01 {
  const packet = rebuildPacketForLineageTest(source, {
    generated_at: addIsoMillisecondsV01(source.generated_at, 1_000),
    constraints: {
      ...source.constraints,
      data_classification: "public_safe",
    },
  });
  const db = openVNextLocalOperatorDatabaseV01(config);
  try {
    insertPacketRecord(db, packet);
  } finally {
    db.close();
  }
  return packet;
}

function installPolicySafeLivePacketV01(
  config: VNextLocalOperatorPilotConfigV01,
  source: TaskContextPacketV01,
  automation: NativeHostAutomationContextV01,
  input: {
    approval_capabilities: string[];
    resources: string[];
    expires_at: string | null;
  },
): TaskContextPacketV01 {
  const identityDb = openVNextLocalOperatorDatabaseV01(config);
  const rootFingerprint = (() => {
    try {
      const registration = readCanonicalProjectWithRootV01(identityDb, config);
      assert(registration);
      return createProtocolSha256V01(
        canonicalizeProtocolValueV01({
          workspace_id: config.workspace_id,
          project_id: config.project_id,
          local_root: registration.root_binding.local_root,
          binding_version: registration.root_binding.binding_version,
          bound_at: registration.root_binding.bound_at,
        }),
      );
    } finally {
      identityDb.close();
    }
  })();
  const packet = rebuildPacketForLineageTest(source, {
    generated_at: addIsoMillisecondsV01(source.generated_at, 2_000),
    constraints: {
      ...source.constraints,
      data_classification: "public_safe",
    },
    capability_grant: {
      grant_ref: automation.capability_grant_ref.external_id,
      grant_external_ref: automation.capability_grant_ref,
      allowed_capabilities: [
        "project_scoped_structured_task_round_trip.v0.1",
        ...input.approval_capabilities,
      ],
      forbidden_capabilities: [],
      resource_scope: [
        config.project_id,
        `project_root:${rootFingerprint}`,
        ...input.resources,
      ],
      stop_conditions: ["timeout", "cancellation_requested"],
      coverage: "enforced",
      expires_at: input.expires_at,
    },
  });
  const db = openVNextLocalOperatorDatabaseV01(config);
  try {
    insertPacketRecord(db, packet);
  } finally {
    db.close();
  }
  return packet;
}

async function waitForLiveProjectionV01(
  service: LiveNativeHostRunServiceV01,
  config: VNextLocalOperatorPilotConfigV01,
  predicate: (projection: LiveNativeHostRunProjectionV01) => boolean,
  timeoutMs = 10_000,
  label = "unlabeled",
): Promise<LiveNativeHostRunProjectionV01> {
  const deadline = Date.now() + timeoutMs;
  let projection = service.read(config);
  const observed: string[] = [];
  while (!predicate(projection)) {
    const state = `${projection.status}:${projection.public_reason ?? "none"}:${projection.pending_approval ? "approval" : "no_approval"}`;
    if (observed.at(-1) !== state) observed.push(state);
    if (Date.now() >= deadline) {
      throw new Error(
        `live_projection_timeout:${label}:${projection.status}:${projection.public_reason ?? "none"}:observed=${observed.join(",")}`,
      );
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
    projection = service.read(config);
  }
  return projection;
}

async function waitForRunAssessmentProposalV01(
  db: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
    receipt_id: string;
  },
  timeoutMs = 10_000,
): Promise<ProjectRunResultDetailV01> {
  const deadline = Date.now() + timeoutMs;
  let detail = readProjectRunResultDetailV01(db, input);
  while (
    detail.proposal.status === "unavailable" &&
    detail.proposal.reason === "not_created"
  ) {
    if (Date.now() >= deadline) {
      throw new Error("run_assessment_proposal_settlement_timeout");
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 25));
    detail = readProjectRunResultDetailV01(db, input);
  }
  return detail;
}

function projectionFromRouteBodyV01(
  body: Record<string, unknown>,
): LiveNativeHostRunProjectionV01 {
  const value = body.live_run;
  assert(value && typeof value === "object" && !Array.isArray(value));
  return value as LiveNativeHostRunProjectionV01;
}

function cloneRouteCookieJarV01(source: RouteCookieJar): RouteCookieJar {
  const jar = new RouteCookieJar();
  const pair = source.header().split("; ")[0];
  assert(pair);
  jar.setPair(pair);
  return jar;
}

function countRunReceiptsV01(config: VNextLocalOperatorPilotConfigV01): number {
  const db = openVNextLocalOperatorDatabaseV01(config);
  try {
    return countRowsByKind(db, "run_receipt");
  } finally {
    db.close();
  }
}

function readHostRunStateFromConfigV01(
  config: VNextLocalOperatorPilotConfigV01,
  runId: string,
) {
  const db = openVNextLocalOperatorDatabaseV01(config);
  try {
    const run = readAutonomyRunLedgerRecord(runId, { db });
    assert(run);
    return run;
  } finally {
    db.close();
  }
}

interface FakeTraceEntryV01 {
  kind: string;
  value: Record<string, any>;
  at: string;
}

function readFakeTraceV01(tracePath: string): FakeTraceEntryV01[] {
  if (!existsSync(tracePath)) return [];
  return readFileSync(tracePath, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as FakeTraceEntryV01);
}

function countTraceMethodV01(
  trace: FakeTraceEntryV01[],
  method: string,
): number {
  return trace.filter(
    (entry) => entry.kind === "received" && entry.value.method === method,
  ).length;
}

async function waitForFakeTraceMethodV01(
  tracePath: string,
  method: string,
  timeoutMs = 10_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (countTraceMethodV01(readFakeTraceV01(tracePath), method) === 0) {
    if (Date.now() >= deadline) throw new Error(`fake_trace_timeout:${method}`);
    await new Promise<void>((resolve) => setTimeout(resolve, 20));
  }
}

function readNetworkAttemptsV01(pathname: string): number {
  assert.equal(existsSync(pathname), true, "fake_codex_network_count_missing");
  return Number(readFileSync(pathname, "utf8").trim());
}

function assertObservedProcessesStoppedV01(
  observations: CodexAppServerAdapterObservationV01[],
  label = "unlabeled",
): void {
  const pids = observations
    .filter((entry) => entry.kind === "spawned")
    .map((entry) => entry.process_id)
    .filter((pid): pid is number => typeof pid === "number");
  assert(pids.length > 0);
  for (const pid of pids) {
    assert.throws(
      () => process.kill(pid, 0),
      /ESRCH|EPERM|kill ESRCH/,
      `owned_process_still_running:${label}`,
    );
  }
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
  pass(
    "deterministic_host_failure_and_unavailable_results_are_truthful_and_durable",
  );
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
  pass(
    "direct_host_cross_platform_repository_relative_paths_are_type_specific_and_canonical",
  );
  reject(
    "direct_host_absolute_rooted_drive_unc_nul_and_escaping_paths_refused",
  );
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
        assert.equal(
          readHostRunStateV01(db, invocation.request.run_id).status,
          "running",
        );
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
        assert.equal(
          readHostRunStateV01(db, result.run_id).status,
          "timed_out",
        );
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
        assert.equal(
          readHostRunStateV01(db, invocation.request.run_id).status,
          "running",
        );
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

  pass(
    "direct_host_timeout_waits_for_stop_cleanup_before_one_terminal_receipt",
  );
  pass(
    "direct_host_external_cancellation_is_idempotent_and_settled_before_receipt",
  );
  pass(
    "direct_host_invocation_rejection_is_bounded_and_cleans_control_resources",
  );
  pass("direct_host_unconfirmed_stop_stays_nonterminal_without_receipt");
}

async function assertDirectHostRepositoryRelativePathPersistenceOnCloneV01(input: {
    environment: NodeJS.ProcessEnv;
    packet: TaskContextPacketV01;
}): Promise<void> {
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
        assert.equal(
          result.receipt.gaps.some(
            (gap) =>
              gap.code === "native_host_model_invocation_receipt_unresolved",
          ),
          true,
        );
        const resultDetail = readProjectRunResultDetailV01(db, {
          workspace_id: config.workspace_id,
          project_id: config.project_id,
          receipt_id: result.receipt.receipt_id,
        });
        assert.equal(
          resultDetail.model_invocations.some(
            (invocation) => invocation.state === "referenced_unresolved",
          ),
          true,
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
  return (process as unknown as { getActiveResourcesInfo(): string[] })
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
      const result = base.result.then((hostResult): NativeHostResultV01 => ({
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
          model_invocation_receipt_refs: [
            {
              ref_version: "external_ref.v0.1",
              ref_type: "model_invocation_receipt",
              external_id: "model-invocation-receipt:unresolved-fixture",
              observed_at: now(),
              trust_class: "host_attestation",
            },
          ],
      }));
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
        generated_at: addIsoMillisecondsV01(input.packet.generated_at, 31_000),
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
  pass(
    "missing_malformed_stale_superseded_fingerprint_and_cross_project_packets_refuse_prestart",
  );
}

async function expectDirectHostPrestartRefusalV01(input: {
  label: string;
  environment: NodeJS.ProcessEnv;
  packet: TaskContextPacketV01;
  selection?: { packet_id: string; packet_fingerprint: string };
  now?: string;
  setup?: (db: Database.Database) => VNextLocalOperatorPilotConfigV01 | void;
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
        assert.equal(
          countTableRows(db, "autonomy_runs"),
          beforeRuns,
          input.label,
        );
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
          const metadata = path.join(tempRoot, "direct-host-worktree-metadata");
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
          assert.equal(
            observations[0]!.request.root_scope.canonical_root,
            root,
          );
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
  pass(
    "plain_folder_git_repository_and_selected_worktree_scopes_remain_project_bound",
  );
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

function corruptProposalIdempotencyKeyV01(
  config: VNextLocalOperatorPilotConfigV01,
  proposalId: string,
): void {
  const db = openVNextLocalOperatorDatabaseV01(config);
  try {
    db.exec("DROP TRIGGER trg_vnext_core_records_immutable_update");
    const update = db.prepare(
      `UPDATE vnext_core_records
       SET idempotency_key = NULL
       WHERE record_kind = 'episode_delta_proposal'
         AND record_id = ?`,
    ).run(proposalId);
    assert.equal(update.changes, 1);
    db.exec(`
      CREATE TRIGGER trg_vnext_core_records_immutable_update
        BEFORE UPDATE ON vnext_core_records
        BEGIN SELECT RAISE(ABORT, 'vnext_core_records_immutable'); END
    `);
  } finally {
    db.close();
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

type WorkbenchLineageStageV01 =
  "not_applied" | "applied_awaiting_packet" | "packet_compiled";

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
    return;
  }
  assert.equal(chain.compiled_packet?.packet_id, input.packet.packet_id);
  assert.equal(
    chain.compiled_packet?.packet_fingerprint,
    input.packet.integrity.fingerprint,
  );
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
      const basis = createVNextOperatorPilotReviewDecisionSessionBasisRefV01(
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
        idempotency_key: createVNextOperatorPilotDecisionRequestFingerprintV01(
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
                decision_fingerprint: operatorBDecision.integrity.fingerprint,
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
      idempotency_key: createVNextOperatorPilotDecisionRequestFingerprintV01(
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
      const rows = persistedDecisionRows
        .prepare(
        `SELECT record_id, idempotency_key FROM vnext_core_records
         WHERE workspace_id = ? AND project_id = ?
           AND record_kind = 'review_decision'
         ORDER BY created_at, record_id`,
        )
        .all(config.workspace_id, config.project_id) as Array<{
        record_id: string;
        idempotency_key: string | null;
      }>;
      assert.equal(rows.length, 2);
      assert(
        rows.some((row) => row.idempotency_key === priorRequestFingerprint),
      );
      assert(
        rows.some((row) => row.idempotency_key === nextRequestFingerprint),
      );
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
    assert.equal(
      countProjectRecordKindRows(
      crossSessionReplayDbPath,
      config,
      "review_decision",
      ),
      2,
    );
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
    const priorPacketRef = input.proposal.task_context_packet_ref;
    assert(priorPacketRef?.source_ref);

    input.clock.set("2026-07-11T09:06:00.000Z");
    const commitResponse = await transitionHandlers.POST(
      routeRequest("/api/vnext/operator/semantic-transition", {
        method: "POST",
        jar: nextJar,
        body: {
          action: "apply",
          ...nextBinding,
          gate_record_id: gate.gate_record_id,
          gate_record_fingerprint: gate.integrity.fingerprint,
          prior_packet_id: priorPacketRef.external_id,
          prior_packet_fingerprint: priorPacketRef.source_ref,
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
    assert.equal(commitBody.packet_compiled, true);
    nextJar.absorb(commitResponse);
    pass("new_session_decision_previews_confirms_and_applies_atomically");
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
        db
          .prepare(
          `SELECT COUNT(*) AS count FROM vnext_core_records
           WHERE workspace_id = ? AND project_id = ? AND record_kind = ?`,
          )
          .get(config.workspace_id, config.project_id, recordKind) as {
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
      ? (overrides.revisit ?? null)
      : base.revisit,
    requested_transition_intent: Object.hasOwn(
      overrides,
      "requested_transition_intent",
    )
      ? (overrides.requested_transition_intent ?? null)
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
  const validation = validateVNextOperatorPilotReviewDecisionProvenanceV01(db, {
      config,
      proposal,
      decision,
      authenticated_session_id: null,
  });
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
    const generic = recordVNextSemanticCommitAuthorizationInsideTransactionV01(
      db,
      {
        preview: input.preview,
        confirmation_digest: input.preview.confirmation_digest,
        operator_actor_ref: input.decision.actor_ref,
        clock: input.clock,
      },
    );
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
        applyVNextOperatorPilotReviewedSemanticTransitionV01(db, {
          config: input.config,
          credential,
          request: {
            proposal_id: input.preview.proposal_id,
            proposal_fingerprint: input.preview.proposal_fingerprint,
            decision_id: input.preview.decision_id,
            decision_fingerprint: input.preview.decision_fingerprint,
            gate_record_id: generic.gate_record.gate_record_id,
            gate_record_fingerprint: generic.gate_record.integrity.fingerprint,
            prior_packet_id:
              input.proposal.task_context_packet_ref!.external_id,
            prior_packet_fingerprint:
              input.proposal.task_context_packet_ref!.source_ref,
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

    const foreignSession = db
      .prepare(
      `SELECT session_id FROM vnext_local_operator_sessions
       WHERE workspace_id = ? AND project_id = ? AND operator_id <> ?
       ORDER BY issued_at, session_id LIMIT 1`,
      )
      .get(
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
  projectContinuity: {
    GET: ReturnType<typeof createVNextOperatorProjectContinuityHandlerV01>;
    POST: ReturnType<typeof createVNextOperatorContextUseReviewHandlerV01>;
  };
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
    ["GET /api/vnext/operator/project-continuity", input.projectContinuity.GET],
    [
      "POST /api/vnext/operator/project-continuity",
      input.projectContinuity.POST,
    ],
  ]);
  const requests: Array<{ method: string; pathname: string }> = [];
  const server = createServer(async (incoming, outgoing) => {
    try {
      const host = incoming.headers.host ?? "127.0.0.1";
      const requestUrl = new URL(incoming.url ?? "/", `http://${host}`);
      const method = incoming.method ?? "GET";
      const handler = routes.get(`${method} ${requestUrl.pathname}`);
      assert(
        handler,
        `loopback route missing: ${method} ${requestUrl.pathname}`,
      );
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
      const targetUrl = new URL(
        `${sourceUrl.pathname}${sourceUrl.search}`,
        origin,
      );
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
              for (
                let index = 0;
                index < incoming.rawHeaders.length;
                index += 2
              ) {
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
    "GET /api/vnext/operator/project-continuity",
    "POST /api/vnext/operator/project-continuity",
  ]) {
    assert(
      observed.has(expected),
      `missing real loopback request: ${expected}`,
    );
  }
  assert(requests.length >= 12, "full operator route loop must use real HTTP");
  pass("full_operator_route_sequence_exercised_over_real_loopback_http");
}

async function assertTransportAndDisabledRefusals(input: {
  handlers: ReturnType<typeof createVNextLocalOperatorSessionHandlersV01>;
  environment: NodeJS.ProcessEnv;
}): Promise<void> {
  const disabledHandlers = createVNextLocalOperatorSessionHandlersV01({
    environment: {
      ...input.environment,
      AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "0",
    },
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
    const invalidConfigHandlers = createVNextLocalOperatorSessionHandlersV01({
      environment,
    });
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
  for (const header of ["forwarded", "x-forwarded-host", "x-forwarded-proto"]) {
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
          "content-length": String(VNEXT_LOCAL_OPERATOR_MAX_BODY_BYTES_V01 + 1),
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
      db
        .prepare(
        "SELECT * FROM vnext_local_operator_sessions WHERE session_id = ?",
        )
        .get(result.session.session_id),
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

function localGetRequest(
  input: {
  cookie?: string;
  extraHeaders?: Record<string, string>;
  } = {},
): Request {
  const headers = new Headers({ host: "127.0.0.1:3000" });
  if (input.cookie) headers.set("cookie", input.cookie);
  for (const [key, value] of Object.entries(input.extraHeaders ?? {})) {
    headers.set(key, value);
  }
  return new Request("http://127.0.0.1:3000/api/vnext/operator/session", {
    headers,
  });
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

async function publicJson(
  response: Response,
): Promise<Record<string, unknown>> {
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
  return new Request("http://127.0.0.1:3000/api/vnext/operator/session", {
      method: "POST",
      headers,
      body: JSON.stringify(input.body),
  });
}

function localPostHeaders(overrides: Record<string, string> = {}): Headers {
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
  assert.doesNotMatch(
    serialized,
    /bootstrap_token_hash|session_token_hash|action_nonce_hash/,
  );
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
  const db = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const tables = (
      db
        .prepare(
        `SELECT name FROM sqlite_master
         WHERE type = 'table'
           AND name NOT LIKE 'sqlite_%'
           AND name <> 'vnext_local_operator_sessions'
         ORDER BY name`,
        )
        .all() as { name: string }[]
    ).map((row) => row.name);
    return Object.fromEntries(
      tables.map((table) => {
      const rows = db
        .prepare(`SELECT * FROM ${quoteIdentifier(table)}`)
        .all()
        .map((row) => canonicalJson(row))
          .sort((left, right) =>
            JSON.stringify(left).localeCompare(JSON.stringify(right)),
          );
      return [
        table,
        {
          count: rows.length,
          row_hash: `sha256:${createHash("sha256")
            .update(JSON.stringify(rows))
            .digest("hex")}`,
        },
      ];
      }),
    );
  } finally {
    db.close();
  }
}

function assertNoPlaintextCredentialPersistence(databasePath: string): void {
  const db = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
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

function assertDatabaseArtifactsOmitTextV01(
  databasePath: string,
  forbiddenValues: readonly string[],
): void {
  const db = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  let serializedRows = "";
  try {
    const tables = (
      db
        .prepare(
          `SELECT name FROM sqlite_master
           WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
           ORDER BY name`,
        )
        .all() as Array<{ name: string }>
    ).map((row) => row.name);
    serializedRows = JSON.stringify(
      tables.map((table) => ({
        table,
        rows: db.prepare(`SELECT * FROM ${quoteIdentifier(table)}`).all(),
      })),
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
  for (const value of forbiddenValues) {
    assert.equal(serializedRows.includes(value), false, value);
    const bytes = Buffer.from(value, "utf8");
    for (const artifact of databaseArtifacts) {
      assert.equal(
        readFileSync(artifact).includes(bytes),
        false,
        `${artifact}:${value}`,
      );
    }
  }
}

function countRows(databasePath: string, table: string): number {
  const db = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    return Number(
      (
        db
          .prepare(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(table)}`)
          .get() as {
        count: number;
        }
      ).count,
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
      ["semantic_commit_gate", anchors.gate_id, anchors.gate_fingerprint],
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
  const db = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
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
      db
        .prepare(
        `SELECT record_kind, record_id, fingerprint, payload_json
         FROM vnext_core_records`,
        )
        .all(),
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
        db
          .prepare(
          `UPDATE vnext_core_records SET created_at = created_at
           WHERE record_id = 'run-receipt:old-check-populated'`,
          )
          .run(),
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

function assertIntegrity(databasePath: string): void {
  const db = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
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

function pass(caseId: string): void {
  if (!positiveCases.includes(caseId)) positiveCases.push(caseId);
}

function reject(caseId: string): void {
  if (!negativeCases.includes(caseId)) negativeCases.push(caseId);
}
