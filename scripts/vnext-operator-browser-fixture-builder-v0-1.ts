import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";

import Database from "better-sqlite3";

import { createVNextOperatorSemanticReviewHandlersV01 } from "../app/api/vnext/operator/semantic-review/route";
import { createCanonicalTestStrategicCostBudgetV01 } from "../lib/vnext/model-gateway/canonical-test-strategic-transport";
import { createVNextOperatorSemanticTransitionHandlersV01 } from "../app/api/vnext/operator/semantic-transition/route";
import { createVNextLocalOperatorSessionHandlersV01 } from "../app/api/vnext/operator/session/route";
import { createDeterministicCodexAdapterV01 } from "../lib/vnext/native-host/deterministic-codex-adapter";
import {
  buildSemanticReviewLoopTaskContextPacketFixture,
  buildSemanticReviewLoopProposalFixture,
  buildSemanticReviewLoopRunReceiptFixture,
  type SemanticReviewLoopProjectFixtureV01,
} from "../fixtures/vnext/protocol/semantic-review-loop-v0-1";
import { validateEpisodeDeltaProposalV01 } from "../lib/vnext/episode-delta-proposal";
import {
  insertVNextCoreRecordV01,
  readVNextCoreRecordV01,
  type VNextCoreRecordKindV01,
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
import { createEpisodeDeltaCandidateFingerprintV01 } from "../lib/vnext/review-decision";
import { createProtocolSha256V01 } from "../lib/vnext/protocol-primitives";
import { validateStateTransitionReceiptV01 } from "../lib/vnext/state-transition-receipt";
import { buildTaskContextPacketV01, validateTaskContextPacketV01 } from "../lib/vnext/task-context-packet";
import {
  issueVNextLocalOperatorBootstrapV01,
  openVNextLocalOperatorDatabaseV01,
  readVNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
} from "../lib/vnext/runtime/local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "../lib/vnext/runtime/local-runtime-clock";
import { admitStructuredRunReceiptV01 } from "../lib/vnext/persistence/structured-run-receipt-admission";
import { runDirectNativeHostRoundTripV01 } from "../lib/vnext/runtime/direct-native-host-round-trip";
import { readVNextOperatorPilotProposalDurableLineageV01 } from "../lib/vnext/runtime/operator-pilot-workbench-lineage";
import type { EpisodeDeltaProposalV01 } from "../types/vnext/episode-delta-proposal";
import type { StateTransitionReceiptV01 } from "../types/vnext/state-transition-receipt";
import type { TaskContextPacketV01 } from "../types/vnext/task-context-packet";
import {
  migrateVNextDurableSemanticStoreV01,
  migrateVNextLocalOperatorSessionsV01,
} from "./db-migrations.mjs";
import {
  installZeroNetworkGuard,
  ZERO_NETWORK_GUARD_METHODS,
} from "./test-harness-zero-network-guard.mjs";

export const VNEXT_OPERATOR_BROWSER_FIXTURE_VERSION_V01 =
  "vnext_operator_pilot_browser_fixture.v0.1" as const;
export const VNEXT_OPERATOR_BROWSER_FIXTURE_SUMMARY_VERSION_V01 =
  "vnext_operator_browser_fixture_builder.v0.1" as const;

const WORKSPACE_UUID = "11111111-1111-4111-8111-111111111111";
const PROJECT_UUID = "22222222-2222-4222-8222-222222222222";
const WORKSPACE_ID = `workspace:${WORKSPACE_UUID}`;
const PROJECT_ID = `project:${PROJECT_UUID}`;
const OPERATOR_ID = "operator:operator-pilot-browser-fixture";
const DATABASE_FILE = "operator-pilot.db";
const MANIFEST_FILE = "operator-pilot-browser-fixture.json";

export interface VNextOperatorBrowserFixtureManifestV01 {
  fixture_version: typeof VNEXT_OPERATOR_BROWSER_FIXTURE_VERSION_V01;
  workspace_id: string;
  project_id: string;
  operator_id: string;
  proposal_id: string;
  proposal_fingerprint: string;
  strategic_source_proposal_id: string;
  strategic_source_proposal_fingerprint: string;
  strategic_base_fingerprint: string;
  strategic_working_frame_fingerprint: string;
  strategic_source_catalog_fingerprint: string;
  packet_id: string;
  packet_fingerprint: string;
  transition_receipt_id: string;
  transition_receipt_fingerprint: string;
  database_file: typeof DATABASE_FILE;
  database_binding: "deterministic_production_fixture";
  database_identity: DatabaseFileIdentityV01;
  credential_material_included: false;
  external_identity_authenticated: false;
  semantic_authority_granted: false;
}

export interface VNextOperatorBrowserFixtureSummaryV01 {
  summary_version: typeof VNEXT_OPERATOR_BROWSER_FIXTURE_SUMMARY_VERSION_V01;
  status: "pass";
  fixture_version: typeof VNEXT_OPERATOR_BROWSER_FIXTURE_VERSION_V01;
  database_file: typeof DATABASE_FILE;
  manifest_file: typeof MANIFEST_FILE;
  artifact_ownership: "transferred_to_browser_harness";
  production_seams: readonly [
    "review_material",
    "review_decision_route",
    "semantic_transition_route",
    "strategic_analysis_route",
    "project_identity_registry",
  ];
  persisted_lineage_status: "packet_compiled";
  external_network_calls: number;
  provider_calls: number;
  network_guard_methods: typeof ZERO_NETWORK_GUARD_METHODS;
  provider_boundary: "no_live_provider_imports_and_zero_guarded_network_attempts";
  credential_material_included: false;
  private_absolute_path_in_manifest: false;
  default_database_accessed: boolean;
  ambient_database_observation: "absent_before_and_after";
}

export interface VNextOperatorBrowserFixtureValidationV01 {
  status: "pass";
  fixture_version: typeof VNEXT_OPERATOR_BROWSER_FIXTURE_VERSION_V01;
  database_file: typeof DATABASE_FILE;
  manifest_file: typeof MANIFEST_FILE;
  persisted_lineage_status: "packet_compiled";
  credential_material_included: false;
  private_absolute_path_in_manifest: false;
}

interface DatabaseFileIdentityV01 {
  canonical_path_sha256: string;
  device: string;
  inode: string;
}

class FixtureClockV01 implements VNextLocalRuntimeClockV01 {
  constructor(private value: string) {}

  now(): string {
    return this.value;
  }

  set(value: string): void {
    this.value = value;
  }
}

class DeterministicSecretSourceV01
  implements VNextLocalOperatorSecretSourceV01
{
  private sequence = 1;

  bytes(size: number): Uint8Array {
    const seed = createHash("sha256")
      .update(`operator-browser-fixture-secret:${this.sequence}`)
      .digest();
    this.sequence += 1;
    const output = new Uint8Array(size);
    for (let index = 0; index < size; index += 1) {
      output[index] = seed[index % seed.byteLength]!;
    }
    return output;
  }
}

class RouteCookieJarV01 {
  private readonly values = new Map<string, string>();

  absorb(response: Response): void {
    const headers = response.headers as Headers & {
      getSetCookie?: () => string[];
    };
    const cookies = headers.getSetCookie?.() ?? [];
    const values = cookies.length > 0
      ? cookies
      : response.headers.get("set-cookie")
        ? [response.headers.get("set-cookie")!]
        : [];
    for (const cookie of values) {
      const pair = cookie.split(";", 1)[0]!;
      const separator = pair.indexOf("=");
      if (separator <= 0) continue;
      const name = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      if (/Max-Age=0(?:;|$)/iu.test(cookie) || value.length === 0) {
        this.values.delete(name);
      } else {
        this.values.set(name, value);
      }
    }
  }

  header(): string {
    return [...this.values]
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }
}

export async function buildVNextOperatorBrowserFixtureV01(input: {
  output_directory: string;
  reference_time: string;
  test_only_guard_probe?: (context: {
    ambient_database_path: string;
  }) => void | Promise<void>;
}): Promise<VNextOperatorBrowserFixtureSummaryV01> {
  const directory = assertDisposableOutputDirectory(input.output_directory);
  const databasePath = path.join(directory, DATABASE_FILE);
  const manifestPath = path.join(directory, MANIFEST_FILE);
  const projectRoot = path.join(directory, "operator-project-root");
  const ambientDatabasePath = path.join(
    directory,
    "ambient-default-database-sentinel.db",
  );
  const ambientDatabasePaths = databaseFamilyPaths(ambientDatabasePath);
  const createdArtifacts = [
    databasePath,
    manifestPath,
    projectRoot,
    ...ambientDatabasePaths,
  ];
  assert.equal(readdirSync(directory).length, 0, "fixture output directory must be empty");
  const ambientDatabaseBefore = snapshotDatabaseFamily(ambientDatabasePath);
  const originalAmbientDatabasePath = process.env.AUGNES_DB_PATH;
  process.env.AUGNES_DB_PATH = ambientDatabasePath;
  const networkGuard = installZeroNetworkGuard({
    allowLoopback: false,
    errorPrefix: "operator_browser_fixture_external_io_blocked",
  });

  try {
    await input.test_only_guard_probe?.({
      ambient_database_path: ambientDatabasePath,
    });
    assertAmbientDatabaseUnchanged(
      ambientDatabasePath,
      ambientDatabaseBefore,
    );
    const schedule = fixtureSchedule(input.reference_time);
    initializeDatabase(databasePath);
    initializeProject(databasePath, projectRoot);
    const environment = fixtureEnvironment(databasePath);
    const clock = new FixtureClockV01(schedule.session);
    const secretSource = new DeterministicSecretSourceV01();
    const sessionHandlers = createVNextLocalOperatorSessionHandlersV01({
      environment,
      clock,
      secret_source: secretSource,
    });
    const reviewHandlers = createVNextOperatorSemanticReviewHandlersV01({
      environment,
      clock,
      secret_source: secretSource,
      strategic_dependencies: {
        read_model_capability: () => ({
          status: "available",
          summary:
            "The owned browser runtime will provide its fake R4 transport only after fixture transfer.",
          verification: "trusted_local_status",
        }),
        read_cost_budget: () =>
          createCanonicalTestStrategicCostBudgetV01({
            workspace_id: WORKSPACE_ID,
            project_id: PROJECT_ID,
          }),
      },
    });
    const transitionHandlers = createVNextOperatorSemanticTransitionHandlersV01({
      environment,
      clock,
      secret_source: secretSource,
    });
    const jar = new RouteCookieJarV01();
    const bootstrapToken = issueBootstrap(environment, clock, secretSource);
    const bootstrapResponse = await sessionHandlers.POST(
      new Request("http://127.0.0.1:3000/api/vnext/operator/session", {
        method: "POST",
        headers: localMutationHeaders("application/x-www-form-urlencoded"),
        body: new URLSearchParams({
          action: "bootstrap",
          bootstrap_token: bootstrapToken,
        }).toString(),
      }),
    );
    await requireSuccess(bootstrapResponse, 200, "fixture_session_bootstrap");
    jar.absorb(bootstrapResponse);

    const fixtureProject: SemanticReviewLoopProjectFixtureV01 = {
      fixture_id: "operator-browser-fixture",
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      run_id: "run:operator-browser-fixture-source",
    };
    const publicPacket = publicSafePacket(
      buildSemanticReviewLoopTaskContextPacketFixture(fixtureProject),
    );
    const priorPacket = boundedAutomationPacketV01(
      publicPacket,
      publicPacket.generated_at,
      new Date(Date.parse(schedule.result) + 60 * 60_000).toISOString(),
    );
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
    const config = readVNextLocalOperatorPilotConfigV01(environment);
    const prepared = withDatabase(config, (db) => {
      insertVNextCoreRecordV01(db, {
        record_kind: "task_context_packet",
        record_id: priorPacket.packet_id,
        workspace_id: priorPacket.workspace_id,
        project_id: priorPacket.project_id,
        fingerprint: priorPacket.integrity.fingerprint,
        idempotency_key: null,
        payload: priorPacket,
        created_at: priorPacket.generated_at,
      });
      admitStructuredRunReceiptV01(db, fixtureReceipt);
      insertVNextCoreRecordV01(db, {
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
    });
    const detailResponse = await reviewHandlers.GET(
      routeRequest("/api/vnext/operator/semantic-review", {
        method: "GET",
        jar,
        query: { proposal_id: prepared.proposal.proposal_id },
      }),
    );
    const detailBody = await requireSuccess(
      detailResponse,
      200,
      "fixture_review_detail",
    );
    const detail = detailBody.proposal as {
      candidates: Array<{
        candidate: EpisodeDeltaProposalV01["proposed_deltas"][number];
        candidate_fingerprint: string;
        pilot_admission: { decision_allowed: { accept: boolean } };
      }>;
    };
    const selected = detail.candidates.find(
      (candidate) => candidate.pilot_admission.decision_allowed.accept,
    );
    assert(selected, "fixture requires one admitted accept/create candidate");
    assert.equal(
      selected.candidate_fingerprint,
      createEpisodeDeltaCandidateFingerprintV01(selected.candidate),
    );
    const decisionRequest = {
      proposal_id: prepared.proposal.proposal_id,
      proposal_fingerprint: prepared.proposal.integrity.fingerprint,
      candidate_id: selected.candidate.candidate_id,
      candidate_fingerprint: selected.candidate_fingerprint,
      decision: "accept",
      rationale_summary:
        "Synthetic browser fixture accepts one isolated candidate for the persisted golden path.",
      revisit: null,
    };
    clock.set(schedule.decision);
    const decisionResponse = await reviewHandlers.POST(
      routeRequest("/api/vnext/operator/semantic-review", {
        method: "POST",
        jar,
        body: decisionRequest,
      }),
    );
    const decisionBody = await requireSuccess(
      decisionResponse,
      201,
      "fixture_review_decision",
    );
    jar.absorb(decisionResponse);
    const decision = decisionBody.decision as {
      decision_id: string;
      integrity: { fingerprint: string };
    };
    const decisionBinding = {
      proposal_id: prepared.proposal.proposal_id,
      proposal_fingerprint: prepared.proposal.integrity.fingerprint,
      decision_id: decision.decision_id,
      decision_fingerprint: decision.integrity.fingerprint,
    };
    const previewResponse = await transitionHandlers.GET(
      routeRequest("/api/vnext/operator/semantic-transition", {
        method: "GET",
        jar,
        query: decisionBinding,
      }),
    );
    const previewBody = await requireSuccess(
      previewResponse,
      200,
      "fixture_transition_preview",
    );
    jar.absorb(previewResponse);
    const preview = previewBody.preview as { confirmation_digest: string };
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
    const confirmBody = await requireSuccess(
      confirmResponse,
      201,
      "fixture_transition_confirm",
    );
    jar.absorb(confirmResponse);
    const gate = confirmBody.gate_record as {
      gate_record_id: string;
      integrity: { fingerprint: string };
    };

    clock.set(schedule.commit);
    const commitResponse = await transitionHandlers.POST(
      routeRequest("/api/vnext/operator/semantic-transition", {
        method: "POST",
        jar,
        body: {
          action: "apply",
          ...decisionBinding,
          gate_record_id: gate.gate_record_id,
          gate_record_fingerprint: gate.integrity.fingerprint,
          prior_packet_id: priorPacket.packet_id,
          prior_packet_fingerprint: priorPacket.integrity.fingerprint,
        },
      }),
    );
    const commitBody = await requireSuccess(
      commitResponse,
      201,
      "fixture_transition_commit",
    );
    jar.absorb(commitResponse);
    const transitionReceipt =
      commitBody.transition_receipt as StateTransitionReceiptV01;
    const laterPacket = commitBody.later_packet as TaskContextPacketV01;
    assert.equal(commitBody.packet_compiled, true);
    clock.set(schedule.result);
    const sourceRunDb = openVNextLocalOperatorDatabaseV01(config);
    const sourceRun = await runDirectNativeHostRoundTripV01(
      sourceRunDb,
      { config, mode: "interactive" },
      {
        adapter: createDeterministicCodexAdapterV01({
          now: () => clock.now(),
        }),
        now: () => clock.now(),
      },
    ).finally(() => sourceRunDb.close());
    assert.equal(sourceRun.status, "inserted");
    assert.equal(sourceRun.proposal.status, "available");
    if (sourceRun.proposal.status !== "available") {
      throw new Error("fixture strategic source proposal unavailable");
    }
    const sourceProposalId = sourceRun.proposal.proposal_id;
    const sourceProposalFingerprint = sourceRun.proposal.proposal_fingerprint;
    const sourceDetailResponse = await reviewHandlers.GET(
      routeRequest("/api/vnext/operator/semantic-review", {
        method: "GET",
        jar,
        query: { proposal_id: sourceProposalId },
      }),
    );
    const sourceDetailBody = await requireSuccess(
      sourceDetailResponse,
      200,
      "fixture_strategic_source_detail",
    );
    const strategicReadback = (
      sourceDetailBody.proposal as {
        strategic_analysis: {
          status: string;
          base_fingerprint: string | null;
          working_frame_fingerprint: string | null;
          source_catalog_fingerprint: string | null;
        };
      }
    ).strategic_analysis;
    assert.equal(strategicReadback.status, "eligible");
    assert(strategicReadback.base_fingerprint);
    assert(strategicReadback.working_frame_fingerprint);
    assert(strategicReadback.source_catalog_fingerprint);
    finalizeTransferredDatabase(databasePath, projectRoot, schedule.compile);
    const manifest: VNextOperatorBrowserFixtureManifestV01 = {
      fixture_version: VNEXT_OPERATOR_BROWSER_FIXTURE_VERSION_V01,
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      operator_id: OPERATOR_ID,
      proposal_id: prepared.proposal.proposal_id,
      proposal_fingerprint: prepared.proposal.integrity.fingerprint,
      strategic_source_proposal_id: sourceProposalId,
      strategic_source_proposal_fingerprint: sourceProposalFingerprint,
      strategic_base_fingerprint: strategicReadback.base_fingerprint,
      strategic_working_frame_fingerprint:
        strategicReadback.working_frame_fingerprint,
      strategic_source_catalog_fingerprint:
        strategicReadback.source_catalog_fingerprint,
      packet_id: laterPacket.packet_id,
      packet_fingerprint: laterPacket.integrity.fingerprint,
      transition_receipt_id: transitionReceipt.transition_receipt_id,
      transition_receipt_fingerprint:
        transitionReceipt.integrity.fingerprint,
      database_file: DATABASE_FILE,
      database_binding: "deterministic_production_fixture",
      database_identity: databaseFileIdentity(databasePath),
      credential_material_included: false,
      external_identity_authenticated: false,
      semantic_authority_granted: false,
    };
    assertManifestIsPublicSafe(manifest);
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
    chmodSync(databasePath, 0o600);
    const validated = validateVNextOperatorBrowserFixtureV01({
      fixture_directory: directory,
      observed_at: schedule.compile,
    });
    assert.equal(validated.persisted_lineage_status, "packet_compiled");
    const ambientDatabaseObservation = observeAmbientDatabase(
      ambientDatabasePath,
      ambientDatabaseBefore,
    );
    const externalNetworkCalls = networkGuard.attempts.length;
    const providerCalls = networkGuard.attempts.length;
    assert.equal(
      externalNetworkCalls,
      0,
      "fixture production seams attempted external network access",
    );
    assert.equal(
      ambientDatabaseObservation.accessed,
      false,
      "fixture production seams accessed the ambient/default database",
    );
    return {
      summary_version: VNEXT_OPERATOR_BROWSER_FIXTURE_SUMMARY_VERSION_V01,
      ...validated,
      artifact_ownership: "transferred_to_browser_harness",
      production_seams: [
        "review_material",
        "review_decision_route",
        "semantic_transition_route",
        "strategic_analysis_route",
        "project_identity_registry",
      ],
      external_network_calls: externalNetworkCalls,
      provider_calls: providerCalls,
      network_guard_methods: ZERO_NETWORK_GUARD_METHODS,
      provider_boundary:
        "no_live_provider_imports_and_zero_guarded_network_attempts",
      default_database_accessed: ambientDatabaseObservation.accessed,
      ambient_database_observation: "absent_before_and_after",
    };
  } catch (error) {
    for (const artifact of createdArtifacts) {
      rmSync(artifact, { recursive: true, force: true });
    }
    throw error;
  } finally {
    networkGuard.restore();
    if (originalAmbientDatabasePath === undefined) {
      delete process.env.AUGNES_DB_PATH;
    } else {
      process.env.AUGNES_DB_PATH = originalAmbientDatabasePath;
    }
  }
}

export function validateVNextOperatorBrowserFixtureV01(input: {
  fixture_directory: string;
  observed_at?: string;
}): VNextOperatorBrowserFixtureValidationV01 {
  const directory = assertDisposableFixtureDirectory(input.fixture_directory);
  const databasePath = path.join(directory, DATABASE_FILE);
  const manifestPath = path.join(directory, MANIFEST_FILE);
  assert.equal(existsSync(databasePath), true, "fixture database missing");
  assert.equal(existsSync(manifestPath), true, "fixture manifest missing");
  const manifest = JSON.parse(
    readFileSync(manifestPath, "utf8"),
  ) as VNextOperatorBrowserFixtureManifestV01;
  assertManifestShape(manifest);
  assertManifestIsPublicSafe(manifest);
  assert.deepEqual(
    manifest.database_identity,
    databaseFileIdentity(databasePath),
    "fixture database identity mismatch",
  );
  const config = readVNextLocalOperatorPilotConfigV01(
    fixtureEnvironment(databasePath),
  );
  const db = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    db.pragma("foreign_keys = ON");
    assert.deepEqual(db.pragma("integrity_check"), [{ integrity_check: "ok" }]);
    const proposal = requireCoreRecord<EpisodeDeltaProposalV01>(
      db,
      "episode_delta_proposal",
      manifest.proposal_id,
      manifest.proposal_fingerprint,
    );
    const strategicSourceProposal = requireCoreRecord<EpisodeDeltaProposalV01>(
      db,
      "episode_delta_proposal",
      manifest.strategic_source_proposal_id,
      manifest.strategic_source_proposal_fingerprint,
    );
    const packet = requireCoreRecord<TaskContextPacketV01>(
      db,
      "task_context_packet",
      manifest.packet_id,
      manifest.packet_fingerprint,
    );
    const transition = requireCoreRecord<StateTransitionReceiptV01>(
      db,
      "state_transition_receipt",
      manifest.transition_receipt_id,
      manifest.transition_receipt_fingerprint,
    );
    assert.equal(validateEpisodeDeltaProposalV01(proposal).status, "valid");
    assert.equal(
      validateEpisodeDeltaProposalV01(strategicSourceProposal).status,
      "valid",
    );
    const strategicProposalCount = Number(
      (
        db
      .prepare(
            `SELECT COUNT(*) AS count
           FROM vnext_core_records
          WHERE record_kind = 'episode_delta_proposal'
            AND workspace_id = ?
            AND project_id = ?
            AND json_type(payload_json, '$.strategic_advantage_transfer') = 'object'`,
      )
          .get(WORKSPACE_ID, PROJECT_ID) as { count: number }
      ).count,
    );
    assert.equal(
      strategicProposalCount,
      0,
      "fixture must leave strategic analysis and proposal admission to the browser",
    );
    assert.equal(
      validateTaskContextPacketV01(packet, {
        evaluated_at: packet.generated_at,
      }).status,
      "valid",
    );
    assert.equal(validateStateTransitionReceiptV01(transition).status, "valid");
    const lineage = readVNextOperatorPilotProposalDurableLineageV01(db, {
      config,
      proposal,
      clock: {
        now: () => input.observed_at ?? packet.generated_at,
      },
    });
    assert.equal(lineage.overall_status, "packet_compiled");
    assert.equal(lineage.read_only, true);
    assert.equal(lineage.semantic_authority_granted, false);
    const project = readCanonicalProjectWithRootV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
    });
    assert(project);
    assert.equal(
      project.root_binding.local_root.normalized_path.startsWith(
        `${directory}${path.sep}`,
      ),
      true,
    );
    const sessionRows = db
      .prepare(
        `SELECT bootstrap_token_hash, session_token_hash, action_nonce_hash
         FROM vnext_local_operator_sessions`,
      )
      .all() as Array<Record<string, string | null>>;
    assert.equal(sessionRows.length > 0, true);
    assert.equal(
      sessionRows.every((row) =>
        Object.values(row).every(
          (value) => value === null || /^sha256:[a-f0-9]{64}$/u.test(value),
        ),
      ),
      true,
    );
  } finally {
    db.close();
  }
  return {
    status: "pass",
    fixture_version: VNEXT_OPERATOR_BROWSER_FIXTURE_VERSION_V01,
    database_file: DATABASE_FILE,
    manifest_file: MANIFEST_FILE,
    persisted_lineage_status: "packet_compiled",
    credential_material_included: false,
    private_absolute_path_in_manifest: false,
  };
}

function initializeDatabase(databasePath: string): void {
  const db = new Database(databasePath);
  try {
    db.pragma("foreign_keys = ON");
    db.exec(readFileSync(path.join(process.cwd(), "lib/db/schema.sql"), "utf8"));
    migrateVNextDurableSemanticStoreV01(db);
    migrateVNextLocalOperatorSessionsV01(db);
  } finally {
    db.close();
  }
}

function initializeProject(databasePath: string, projectRoot: string): void {
  mkdirSync(projectRoot, { recursive: true, mode: 0o700 });
  const db = new Database(databasePath, { fileMustExist: true });
  try {
    db.pragma("foreign_keys = ON");
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(db, {
      create_uuid: () => WORKSPACE_UUID,
      now: () => "2026-07-10T00:00:00.000Z",
    });
    const registration = getOrCreateCanonicalProjectForLocalRootV01(
      db,
      {
        workspace_id: workspace.workspace_id,
        local_root: normalizeLocalProjectRootRefV01(projectRoot, {
          base_path: path.parse(projectRoot).root,
        }),
        display_name: "Operator Browser Fixture Project",
      },
      {
        create_uuid: () => PROJECT_UUID,
        now: () => "2026-07-10T00:00:00.000Z",
      },
    );
    assert.equal(registration.project.project_id, PROJECT_ID);
    touchRecentProjectV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      now: "2026-07-10T00:00:00.000Z",
    });
    selectActiveProjectV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      now: "2026-07-10T00:00:00.000Z",
      expected_project_id: null,
      expected_revision: null,
    });
  } finally {
    db.close();
  }
}

function finalizeTransferredDatabase(
  databasePath: string,
  projectRoot: string,
  boundAt: string,
): void {
  const db = new Database(databasePath, { fileMustExist: true });
  try {
    db.pragma("foreign_keys = ON");
    rebindCanonicalProjectLocalRootV01(
      db,
      {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        local_root: normalizeLocalProjectRootRefV01(projectRoot, {
          base_path: path.parse(projectRoot).root,
        }),
      },
      { now: () => boundAt },
    );
    db.prepare(
      "DELETE FROM vnext_active_project_selections WHERE workspace_id = ?",
    ).run(WORKSPACE_ID);
    db.prepare("DELETE FROM vnext_recent_projects WHERE workspace_id = ?").run(
      WORKSPACE_ID,
    );
  } finally {
    db.close();
  }
}

function issueBootstrap(
  environment: NodeJS.ProcessEnv,
  clock: VNextLocalRuntimeClockV01,
  secretSource: VNextLocalOperatorSecretSourceV01,
): string {
  const config = readVNextLocalOperatorPilotConfigV01(environment);
  const db = openVNextLocalOperatorDatabaseV01(config);
  try {
    return issueVNextLocalOperatorBootstrapV01(db, {
      config,
      clock,
      secret_source: secretSource,
    }).bootstrap_token;
  } finally {
    db.close();
  }
}

function withDatabase<T>(
  config: ReturnType<typeof readVNextLocalOperatorPilotConfigV01>,
  action: (db: Database.Database) => T,
): T {
  const db = openVNextLocalOperatorDatabaseV01(config);
  try {
    return action(db);
  } finally {
    db.close();
  }
}

function fixtureEnvironment(databasePath: string): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "test",
    AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1",
    AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: WORKSPACE_ID,
    AUGNES_VNEXT_OPERATOR_PROJECT_ID: PROJECT_ID,
    AUGNES_VNEXT_OPERATOR_ID: OPERATOR_ID,
    AUGNES_DB_PATH: databasePath,
  };
}

function fixtureSchedule(referenceTime: string): Record<
  "session" | "decision" | "commit" | "compile" | "result" | "review",
  string
> {
  const reference = Date.parse(referenceTime);
  assert.equal(Number.isFinite(reference), true, "fixture reference time invalid");
  const compile = reference - 10 * 60_000;
  return {
    session: new Date(compile - 4 * 60_000).toISOString(),
    decision: new Date(compile - 3 * 60_000).toISOString(),
    commit: new Date(compile - 2 * 60_000).toISOString(),
    compile: new Date(compile).toISOString(),
    result: new Date(compile + 2 * 60_000).toISOString(),
    review: new Date(compile + 4 * 60_000).toISOString(),
  };
}

function publicSafePacket(packet: TaskContextPacketV01): TaskContextPacketV01 {
  const {
    packet_version: _version,
    packet_id: _packetId,
    authority_summary: authoritySummary,
    integrity: _integrity,
    ...builderInput
  } = packet;
  return buildTaskContextPacketV01({
    ...builderInput,
    constraints: {
      ...packet.constraints,
      data_classification: "public_safe",
    },
    authority_notes: authoritySummary.notes,
  });
}

function boundedAutomationPacketV01(
  packet: TaskContextPacketV01,
  generatedAt: string,
  expiresAt: string,
): TaskContextPacketV01 {
  const {
    packet_version: _version,
    packet_id: _packetId,
    authority_summary: authoritySummary,
    integrity: _integrity,
    ...builderInput
  } = packet;
  const grantFingerprint = createProtocolSha256V01(
    `${packet.project_id}:operator-browser-bounded-cycle`,
  );
  return buildTaskContextPacketV01({
    ...builderInput,
    generated_at: generatedAt,
    expires_at: expiresAt,
    capability_grant: {
      grant_ref: "grant:operator-browser-bounded-cycle",
      grant_external_ref: {
        ref_version: "external_ref.v0.1",
        ref_type: "capability_grant",
        external_id: "grant:operator-browser-bounded-cycle",
        observed_at: generatedAt,
        source_ref: grantFingerprint,
        compatibility_namespace: "bounded_autohunt_review_needed.v0.1",
        trust_class: "direct_local_observation",
      },
      allowed_capabilities: [
        "project_scoped_structured_task_round_trip.v0.1",
      ],
      forbidden_capabilities: [
        "credential_access",
        "deploy",
        "external_post",
        "merge",
        "model_invocation",
        "network_access",
        "publish",
      ],
      resource_scope: [packet.project_id],
      stop_conditions: [
        "budget_exhausted",
        "cancellation_requested",
        "review_needed",
        "timeout",
      ],
      coverage: "enforced",
      expires_at: expiresAt,
    },
    authority_notes: authoritySummary.notes,
  });
}

function routeRequest(
  routePath: string,
  input: {
    method: "GET" | "POST";
    jar: RouteCookieJarV01;
    query?: Record<string, string>;
    body?: Record<string, unknown>;
  },
): Request {
  const url = new URL(`http://127.0.0.1:3000${routePath}`);
  for (const [key, value] of Object.entries(input.query ?? {})) {
    url.searchParams.set(key, value);
  }
  const headers = input.method === "POST"
    ? localMutationHeaders("application/json")
    : new Headers({ host: "127.0.0.1:3000" });
  const cookie = input.jar.header();
  if (cookie) headers.set("cookie", cookie);
  return new Request(url, {
    method: input.method,
    headers,
    ...(input.body ? { body: JSON.stringify(input.body) } : {}),
  });
}

function localMutationHeaders(contentType: string): Headers {
  return new Headers({
    host: "127.0.0.1:3000",
    origin: "http://127.0.0.1:3000",
    "sec-fetch-site": "same-origin",
    "content-type": contentType,
  });
}

async function requireSuccess(
  response: Response,
  status: number,
  label: string,
): Promise<Record<string, unknown>> {
  const body = (await response.clone().json()) as Record<string, unknown>;
  assert.equal(
    response.status,
    status,
    `${label}:${String(body.error_code ?? body.status ?? "unexpected_response")}`,
  );
  const serialized = JSON.stringify(body);
  for (const forbidden of [
    "bootstrap_token_hash",
    "session_token_hash",
    "action_nonce_hash",
  ]) {
    assert.equal(serialized.includes(forbidden), false, `${label}:${forbidden}`);
  }
  return body;
}

function requireCoreRecord<T>(
  db: Database.Database,
  recordKind: VNextCoreRecordKindV01,
  recordId: string,
  fingerprint: string,
): T {
  const record = readVNextCoreRecordV01(db, {
    record_kind: recordKind,
    record_id: recordId,
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
  });
  assert(record, `fixture ${recordKind} record missing`);
  assert.equal(record.fingerprint, fingerprint, `${recordKind} fingerprint mismatch`);
  return record.payload as T;
}

function assertDisposableOutputDirectory(requestedDirectory: string): string {
  assert.equal(path.isAbsolute(requestedDirectory), true, "fixture output must be absolute");
  const directory = path.resolve(requestedDirectory);
  assertPathInsideRoot(path.resolve(tmpdir()), directory);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const canonicalDirectory = realpathSync(directory);
  assertPathInsideOsTemp(canonicalDirectory);
  return canonicalDirectory;
}

function assertDisposableFixtureDirectory(requestedDirectory: string): string {
  assert.equal(path.isAbsolute(requestedDirectory), true, "fixture path must be absolute");
  const directory = realpathSync(requestedDirectory);
  assertPathInsideOsTemp(directory);
  return directory;
}

function assertPathInsideOsTemp(directory: string): void {
  const osTemp = realpathSync(tmpdir());
  assertPathInsideRoot(osTemp, directory);
}

function assertPathInsideRoot(root: string, directory: string): void {
  const relative = path.relative(root, directory);
  assert(
    relative.length > 0 &&
      relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative),
    "browser fixture must stay inside the OS temporary directory",
  );
}

function assertManifestShape(
  manifest: VNextOperatorBrowserFixtureManifestV01,
): void {
  assert.equal(
    manifest.fixture_version,
    VNEXT_OPERATOR_BROWSER_FIXTURE_VERSION_V01,
  );
  assert.equal(manifest.workspace_id, WORKSPACE_ID);
  assert.equal(manifest.project_id, PROJECT_ID);
  assert.equal(manifest.operator_id, OPERATOR_ID);
  assert.equal(manifest.database_file, DATABASE_FILE);
  assert.equal(manifest.database_binding, "deterministic_production_fixture");
  for (const field of [
    "proposal_id",
    "proposal_fingerprint",
    "strategic_source_proposal_id",
    "strategic_source_proposal_fingerprint",
    "strategic_base_fingerprint",
    "strategic_working_frame_fingerprint",
    "strategic_source_catalog_fingerprint",
    "packet_id",
    "packet_fingerprint",
    "transition_receipt_id",
    "transition_receipt_fingerprint",
  ] as const) {
    assert.equal(
      typeof manifest[field] === "string" && manifest[field].length > 0,
      true,
      `fixture manifest ${field} missing`,
    );
  }
  assert.equal(manifest.credential_material_included, false);
  assert.equal(manifest.external_identity_authenticated, false);
  assert.equal(manifest.semantic_authority_granted, false);
}

function assertManifestIsPublicSafe(
  manifest: VNextOperatorBrowserFixtureManifestV01,
): void {
  const serialized = JSON.stringify(manifest);
  for (const forbidden of [
    process.env.HOME,
    process.env.USERPROFILE,
    "bootstrap_token",
    "session_token",
    "action_nonce",
    "prompt",
    "transcript",
    "hidden_reasoning",
    "private_conversation",
  ].filter((value): value is string => Boolean(value))) {
    assert.equal(serialized.includes(forbidden), false, "fixture manifest is not public-safe");
  }
}

function databaseFileIdentity(databasePath: string): DatabaseFileIdentityV01 {
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

function databaseFamilyPaths(databasePath: string): string[] {
  return [
    databasePath,
    `${databasePath}-wal`,
    `${databasePath}-shm`,
    `${databasePath}-journal`,
  ];
}

function snapshotDatabaseFamily(
  databasePath: string,
): Record<string, { sha256: string; size: number }> {
  const snapshot: Record<string, { sha256: string; size: number }> = {};
  for (const candidate of databaseFamilyPaths(databasePath)) {
    if (!existsSync(candidate)) continue;
    const contents = readFileSync(candidate);
    snapshot[path.basename(candidate)] = {
      sha256: createHash("sha256").update(contents).digest("hex"),
      size: contents.byteLength,
    };
  }
  return snapshot;
}

function observeAmbientDatabase(
  databasePath: string,
  before: Record<string, { sha256: string; size: number }>,
): { accessed: boolean } {
  const after = snapshotDatabaseFamily(databasePath);
  return { accessed: !isDeepStrictEqual(after, before) };
}

function assertAmbientDatabaseUnchanged(
  databasePath: string,
  before: Record<string, { sha256: string; size: number }>,
): void {
  assert.equal(
    observeAmbientDatabase(databasePath, before).accessed,
    false,
    "fixture ambient/default database sentinel changed",
  );
}

function addMilliseconds(value: string, milliseconds: number): string {
  return new Date(Date.parse(value) + milliseconds).toISOString();
}
