#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { Socket } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import { genericCliDirectObservationInputFixture } from "../fixtures/vnext/protocol/run-receipt-v0-1";
import {
  DURABLE_LOCAL_LOOP_APPLIED_AT,
  DURABLE_LOCAL_LOOP_CONFIRMED_AT,
  DURABLE_LOCAL_LOOP_CURRENT_STATE_OBSERVED_AT,
  DURABLE_LOCAL_LOOP_ELIGIBILITY_EVALUATED_AT,
  DURABLE_LOCAL_LOOP_GATE_EVALUATED_AT,
  DURABLE_LOCAL_LOOP_GATE_EXPIRES_AT,
  DURABLE_LOCAL_LOOP_PREVIEWED_AT,
  DURABLE_LOCAL_LOOP_RECORDED_AT,
  buildDurableLocalClosedLoopM3APrefixFixtureV01,
} from "../fixtures/vnext/runtime/durable-local-closed-loop-v0-1";
import { createSemanticTransitionDecisionInputV01 } from "../fixtures/vnext/protocol/semantic-transition-loop-v0-1";
import { buildSemanticReviewLoopProposalFixture } from "../fixtures/vnext/protocol/semantic-review-loop-v0-1";
import {
  TASK_CONTEXT_PACKET_FIXTURE_EXPIRES_AT,
  TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT,
  genericCliBuilderInputFixture,
} from "../fixtures/vnext/protocol/task-context-packet-v0-1";
import {
  buildEpisodeDeltaProposalV01,
  createEpisodeDeltaProposalFingerprintV01,
  deriveEpisodeDeltaProposalIdV01,
  validateEpisodeDeltaProposalV01,
} from "../lib/vnext/episode-delta-proposal";
import {
  confirmLocalProjectOnboardingV01,
  listRecentProjectsV01,
  pickAndInspectLocalProjectRecoveryV01,
  pickAndInspectLocalProjectV01,
  previewLocalProjectRootRebindFromSelectionV01,
  rebindLocalProjectRootFromSelectionV01,
} from "../lib/vnext/onboarding/local-project-onboarding";
import {
  authorizeRepositoryExecutionDecisionFromBrowserSessionInsideTransactionV01,
} from "../lib/vnext/repository-execution/repository-execution";
import {
  consumeVNextLocalOperatorBootstrapV01,
  issueVNextLocalOperatorBootstrapV01,
  issueVNextRepositoryDecisionChallengeV01,
  readVNextLocalOperatorCredentialFromRequestV01,
  VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01,
} from "../lib/vnext/runtime/local-operator-session";
import {
  insertVNextCoreRecordV01,
} from "../lib/vnext/persistence/durable-semantic-store";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "../lib/vnext/protocol-primitives";
import {
  ModelInvocationRunReceiptProjectionErrorV02,
  projectModelInvocationReceiptToRunReceiptEntryV02,
} from "../lib/vnext/model-gateway/run-receipt-projection";
import {
  buildRunReceiptV01,
  type RunReceiptBuilderInputV01,
} from "../lib/vnext/run-receipt";
import {
  getOrCreateCanonicalProjectForLocalRootV01,
  getOrCreateDefaultWorkspaceIdentityV01,
  listProjectExternalRefsV01,
  normalizeLocalProjectRootRefV01,
  readDefaultWorkspaceIdentityV01,
} from "../lib/vnext/persistence/project-identity-registry";
import {
  readActiveProjectSelectionV01,
} from "../lib/vnext/persistence/project-lifecycle-registry";
import {
  readProjectHomeCapabilityStatusesV01,
  readProjectHomeEntryDestinationV01,
  readProjectHomeDatabaseCompatibilityV01,
  readProjectHomeProjectionV01,
} from "../lib/vnext/project-home/project-home-projection";
import {
  buildProjectGuideBriefV02,
} from "../lib/vnext/guide-brief/project-guide-brief";
import {
  buildReviewDecisionV01,
  createEpisodeDeltaCandidateFingerprintV01,
  validateReviewDecisionAgainstEpisodeDeltaProposalV01,
  validateReviewDecisionV01,
} from "../lib/vnext/review-decision";
import {
  commitVNextSemanticTransitionV01,
  commitVNextSemanticTransitionWithOperatorPilotCapabilityInsideTransactionV01,
  persistVNextSemanticReviewMaterialV01,
  prepareVNextSemanticCommitPreviewV01,
  recordVNextSemanticCommitAuthorizationV01,
} from "../lib/vnext/runtime/durable-semantic-transition";
import {
  ProjectRunResultReadErrorV01,
  readProjectRunResultDetailV01,
} from "../lib/vnext/runtime/project-run-result-read-model";
import { buildTaskContextPacketV01 } from "../lib/vnext/task-context-packet";
import {
  LEGACY_AUGNES_PROJECT_SCOPE_V01,
} from "../types/vnext/project-identity";
import type { ProjectHomeCapabilityStatusValueV01 } from "../types/vnext/project-home";
import type { EpisodeDeltaProposalV01 } from "../types/vnext/episode-delta-proposal";
import type { ReviewDecisionV01 } from "../types/vnext/review-decision";
import type { TaskContextPacketBuilderInputV01 } from "../lib/vnext/task-context-packet";
import type { ModelInvocationReceiptV02 } from "../types/vnext/model-invocation-receipt";
import type { SemanticReviewLoopProjectFixtureV01 } from "../fixtures/vnext/protocol/semantic-review-loop-v0-1";
import {
  readLegacyProjectWorkItemsCompatibilityV01,
  resolveLegacyProjectCompatibilityIdentityV01,
} from "../lib/vnext/compat/project-identity";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { validateRecoveryCanonicalDatabaseV01 } from "./recovery-canonical-record-validator";
import { readVNextOperatorPilotProposalDurableLineageV01 } from "../lib/vnext/runtime/operator-pilot-workbench-lineage";
import { readSharedProjectInspectorV01 } from "../lib/vnext/runtime/shared-project-inspector";
import {
  recordVNextOperatorPilotReviewDecisionV01,
  readVNextOperatorPilotSemanticReviewV01,
  readVNextOperatorPilotReviewDecisionV01,
  deriveVNextOperatorPilotProposalDecisionApplicationSummaryV01,
} from "../lib/vnext/runtime/operator-pilot-review-material";
import {
  prepareVNextOperatorPilotSemanticCommitPreviewV01,
  confirmVNextOperatorPilotSemanticCommitV01,
} from "../lib/vnext/runtime/operator-pilot-semantic-transition";
import {
  createVNextOperatorPilotReviewWindowCapabilityV01,
  VNEXT_OPERATOR_PILOT_DEFAULT_REVIEW_WINDOW_CONFIG_V01,
} from "../lib/vnext/runtime/operator-pilot-review-window-config-v0-1";

import { projectVNextOperatorPilotContinuityV01 } from "../lib/vnext/runtime/operator-pilot-project-continuity";
import { buildClaimRecordV01, claimRecordReferenceV01, createClaimApplicabilityScopeV01 } from "../lib/vnext/project-verify-material";
import { admitClaimRecordV01 } from "../lib/vnext/persistence/project-verify-material-store";
import { admitProjectVerifyLifecycleProposalV01, materializeProjectVerifyClaimLifecycleProposalV01 } from "../lib/vnext/persistence/project-verify-lifecycle-admission";
import type { ClaimRecordV01 } from "../types/vnext/project-verify-material";

const root = mkdtempSync(path.join(tmpdir(), "augnes-project-home-"));
const dbPath = path.join(root, "project-home.db");
const emptyRoot = path.join(root, "Empty local project");
const projectARoot = path.join(root, "Project A");
const projectBRoot = path.join(root, "Project B");
const temporalReviewRoot = path.join(root, "Temporal Review Project");
const contextReviewRoot = path.join(root, "Context Review Project");
const recoveredProjectARoot = path.join(root, "Project A recovered");
const sharedRemote = "https://example.test/shared/project-home.git";
const fixedGeneratedAt = "2026-07-15T09:00:00.000Z";
const expiringPerspectiveMarker = "PROJECT A EXPIRING WORKING CONTEXT — NOT ACCEPTED STATE";
const noExpiryPerspectiveMarker = "PROJECT B NO-EXPIRY WORKING CONTEXT — NOT ACCEPTED STATE";
const acceptedMarker = "PROJECT A ACCEPTED STATE MARKER";
const projectBMarker = "PROJECT B PENDING MARKER";
const legacyMarker = "LEGACY PROJECT AUGNES MARKER";
const secretMarker = "project-home-secret-marker";
const privateModelMarker = "gpt-private-project-home-model";
const malformedModelMarker = "private/project home model";
const originalEnvironment = { ...process.env };
const originalFetch = globalThis.fetch;
const originalSocketConnect = Socket.prototype.connect;
let fetchCalls = 0;
let socketCalls = 0;
let pickerProcessCalls = 0;
let db: Database.Database | null = null;

for (const key of [
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "GITHUB_TOKEN",
  "GH_TOKEN",
  "CODEX_HOME",
  "MCP_CONFIG",
  "SCHEDULER_CONFIG",
  "OPENAI_BASE_URL",
]) {
  delete process.env[key];
}

globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("project_home_test_network_forbidden");
};
Socket.prototype.connect = function blockedProjectHomeNetwork(..._args: unknown[]) {
  socketCalls += 1;
  throw new Error("project_home_test_socket_forbidden");
} as typeof Socket.prototype.connect;

function openDatabase() {
  const database = new Database(dbPath);
  database.pragma("foreign_keys = ON");
  applyCanonicalDatabaseMigrations(database);
  return database;
}

async function rebindWithBrowserDecisionV01(
  db: Database.Database,
  input: Omit<
    Parameters<typeof rebindLocalProjectRootFromSelectionV01>[1],
    "decision_request_fingerprint"
  >,
  options: { now?: () => string; now_ms?: () => number } = {},
) {
  const preview = await previewLocalProjectRootRebindFromSelectionV01(
    db,
    input,
    options,
  );
  const now = (options.now ?? (() => new Date().toISOString()))();
  const config = {
    enabled: true as const,
    workspace_id: preview.workspace_id,
    project_id: preview.project_id,
    operator_id: "operator:project-home-rebind",
    database_path: dbPath,
  };
  const base = Date.parse(now);
  const bootstrap = issueVNextLocalOperatorBootstrapV01(db, {
    config,
    clock: { now: () => new Date(base - 2_000).toISOString() },
  });
  const session = consumeVNextLocalOperatorBootstrapV01(db, {
    config,
    bootstrap_token: bootstrap.bootstrap_token,
    clock: { now: () => new Date(base - 1_000).toISOString() },
  });
  const decisionSession = session.repository_decision_session;
  const challenge = issueVNextRepositoryDecisionChallengeV01(db, {
    workspace_id: preview.workspace_id,
    project_id: preview.project_id,
    request_fingerprint: preview.decision_request!.request_fingerprint,
    credential: decisionSession.credential,
    clock: { now: () => now },
  });
  return rebindLocalProjectRootFromSelectionV01(
    db,
    {
      ...input,
      decision_request_fingerprint:
        preview.decision_request!.request_fingerprint,
    },
    {
      ...options,
      authorize_decision_inside_transaction: () => {
        const authorized =
          authorizeRepositoryExecutionDecisionFromBrowserSessionInsideTransactionV01(
            db,
            {
              workspace_id: preview.workspace_id,
              project_id: preview.project_id,
              request_fingerprint:
                preview.decision_request!.request_fingerprint,
              challenge_fingerprint: challenge.challenge_fingerprint,
              credential: decisionSession.credential,
            },
            { now: () => now },
          );
        assert(authorized.decision.grant_fingerprint);
        return {
          grant_fingerprint: authorized.decision.grant_fingerprint,
        };
      },
    },
  );
}

function pickerProcess() {
  return {
    async run() {
      pickerProcessCalls += 1;
      throw new Error("project_home_test_picker_process_forbidden");
    },
  };
}

async function inspectSelection(folder: string, inspectedAt: string) {
  process.env.AUGNES_TEST_FOLDER_PICKER_PATH = folder;
  const selection = await pickAndInspectLocalProjectV01({
    open_database: openDatabase,
    now: () => inspectedAt,
    create_token: () => `selection:${path.basename(folder)}:${inspectedAt}`,
    process: pickerProcess(),
  });
  assert.equal(selection.status, "selected");
  return selection;
}

async function inspectRecoverySelection(
  folder: string,
  inspectedAt: string,
  scope: Parameters<typeof pickAndInspectLocalProjectRecoveryV01>[0],
) {
  process.env.AUGNES_TEST_FOLDER_PICKER_PATH = folder;
  const selection = await pickAndInspectLocalProjectRecoveryV01(scope, {
    open_database: openDatabase,
    now: () => inspectedAt,
    create_token: () => `recovery-selection:${path.basename(folder)}:${inspectedAt}`,
    process: pickerProcess(),
  });
  assert.equal(selection.status, "selected");
  return selection;
}

async function onboard(folder: string, timestamp: string) {
  const selection = await inspectSelection(folder, timestamp);
  assert.equal(selection.status, "selected");
  return confirmLocalProjectOnboardingV01(
    requireDatabase(),
    {
      selection_token: selection.selection_token,
      inspection_fingerprint: selection.inspection.inspection_fingerprint,
    },
    { now: () => timestamp },
  );
}

function requireDatabase(): Database.Database {
  if (!db) throw new Error("project_home_test_database_closed");
  return db;
}

function projectFixture(
  projectId: string,
  workspaceId: string,
  suffix: string,
): SemanticReviewLoopProjectFixtureV01 {
  return {
    fixture_id: `project-home-${suffix}`,
    workspace_id: workspaceId,
    project_id: projectId,
    run_id: `run:project-home-${suffix}`,
  };
}

function rebuildProposal(
  project: SemanticReviewLoopProjectFixtureV01,
  marker: string,
  _suffix: string,
): EpisodeDeltaProposalV01 {
  const source = buildDurableLocalClosedLoopM3APrefixFixtureV01(project).proposal;
  const proposal = clone(source);
  const candidateId = proposal.proposed_deltas[0]!.candidate_id;
  proposal.proposed_deltas = [proposal.proposed_deltas[0]!];
  proposal.missing_information = proposal.missing_information.filter((item) =>
    item.related_delta_ids.includes(candidateId),
  );
  proposal.uncertainties = proposal.uncertainties.filter((item) =>
    item.related_delta_ids.includes(candidateId),
  );
  proposal.bounded_summary = marker;
  proposal.proposed_deltas[0]!.title = marker;
  proposal.proposed_deltas[0]!.proposed_state_summary = marker;
  proposal.proposal_id = deriveEpisodeDeltaProposalIdV01(proposal);
  proposal.integrity.fingerprint = createEpisodeDeltaProposalFingerprintV01(proposal);
  const validation = validateEpisodeDeltaProposalV01(proposal);
  assert.equal(validation.status, "valid", JSON.stringify(validation));
  return proposal;
}

function buildDecision(
  project: SemanticReviewLoopProjectFixtureV01,
  proposal: EpisodeDeltaProposalV01,
  decision: "accept" | "reject" | "defer",
  options: {
    candidate_index?: number;
    prior_decision?: ReviewDecisionV01;
    decided_at?: string;
    revisit?: {
      revisit_at: string | null;
      expires_at: string | null;
      condition_summary: string | null;
    };
  } = {},
) {
  const input = createSemanticTransitionDecisionInputV01(project, proposal);
  const candidate = proposal.proposed_deltas[options.candidate_index ?? 0]!;
  input.candidate = {
    candidate_id: candidate.candidate_id,
    candidate_fingerprint: createEpisodeDeltaCandidateFingerprintV01(candidate),
  };
  input.decision_basis_material_ids = candidate.basis_material_ids;
  input.requested_transition_intent!.target_refs = candidate.target_refs;
  if (options.prior_decision)
    input.lineage.prior_decisions = [
      {
        decision_id: options.prior_decision.decision_id,
        decision_fingerprint: options.prior_decision.integrity.fingerprint,
      },
    ];
  input.decision = decision;
  if (options.decided_at) input.decided_at = options.decided_at;
  if (decision === "reject" || decision === "defer") {
    input.rationale_summary =
      decision === "reject"
        ? "The bounded synthetic proposal is rejected in the Project Home test."
        : "The bounded synthetic proposal remains deferred under explicit revisit semantics.";
    input.requested_transition_intent = null;
  }
  input.revisit = decision === "defer" ? (options.revisit ?? null) : null;
  const result = buildReviewDecisionV01(input);
  assert.equal(validateReviewDecisionV01(result).status, "valid");
  assert.equal(
    validateReviewDecisionAgainstEpisodeDeltaProposalV01(result, proposal).status,
    "valid",
  );
  return result;
}

function persistAcceptedTransition(
  database: Database.Database,
  project: SemanticReviewLoopProjectFixtureV01,
  proposal: EpisodeDeltaProposalV01,
) {
  const decision = buildDecision(project, proposal, "accept");
  persistVNextSemanticReviewMaterialV01(database, { proposal, decision });
  const preview = prepareVNextSemanticCommitPreviewV01(database, {
    workspace_id: project.workspace_id,
    project_id: project.project_id,
    proposal_id: proposal.proposal_id,
    proposal_fingerprint: proposal.integrity.fingerprint,
    decision_id: decision.decision_id,
    decision_fingerprint: decision.integrity.fingerprint,
    authorized_applier_identity: {
      ref_type: "semantic_transition_applier",
      external_id: `local-project-home:${project.project_id}`,
    },
    gate_ttl_ms:
      Date.parse(DURABLE_LOCAL_LOOP_GATE_EXPIRES_AT) -
      Date.parse(DURABLE_LOCAL_LOOP_GATE_EVALUATED_AT),
    clock: fixedClock(
      DURABLE_LOCAL_LOOP_CURRENT_STATE_OBSERVED_AT,
      DURABLE_LOCAL_LOOP_PREVIEWED_AT,
    ),
  });
  const authorization = recordVNextSemanticCommitAuthorizationV01(database, {
    preview,
    confirmation_digest: preview.confirmation_digest,
    operator_actor_ref: decision.actor_ref,
    clock: fixedClock(
      DURABLE_LOCAL_LOOP_CONFIRMED_AT,
      DURABLE_LOCAL_LOOP_GATE_EVALUATED_AT,
      DURABLE_LOCAL_LOOP_ELIGIBILITY_EVALUATED_AT,
    ),
  });
  const committed = commitVNextSemanticTransitionV01(database, {
    workspace_id: project.workspace_id,
    project_id: project.project_id,
    proposal_id: proposal.proposal_id,
    proposal_fingerprint: proposal.integrity.fingerprint,
    decision_id: decision.decision_id,
    decision_fingerprint: decision.integrity.fingerprint,
    gate_record_id: authorization.gate_record.gate_record_id,
    gate_record_fingerprint: authorization.gate_record.integrity.fingerprint,
    clock: fixedClock(DURABLE_LOCAL_LOOP_APPLIED_AT, DURABLE_LOCAL_LOOP_RECORDED_AT),
  });
  assert.equal(committed.status, "applied");
  return { decision, committed };
}

function insertPendingProposal(
  database: Database.Database,
  proposal: EpisodeDeltaProposalV01,
) {
  return insertVNextCoreRecordV01(database, {
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

function insertTaskContextPacket(
  database: Database.Database,
  workspaceId: string,
  projectId: string,
  inputOptions: {
    marker: string;
    perspective_ref: string;
    expires_at: string | null;
    generated_at?: string;
    currentness?: "fresh" | "stale" | "partial";
  },
) {
  const input = clone(genericCliBuilderInputFixture) as TaskContextPacketBuilderInputV01;
  const currentness = clone(input.source_status.currentness);
  const generatedAt =
    inputOptions.generated_at ?? TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT;
  currentness.status = inputOptions.currentness ?? "fresh";
  currentness.as_of = generatedAt;
  currentness.basis = `${currentness.status} project context fixture.`;
  input.workspace_id = workspaceId;
  input.project_id = projectId;
  input.generated_at = generatedAt;
  input.expires_at = inputOptions.expires_at;
  input.current_projection = {
    projection_kind: "current_working_perspective",
    projection_only: true,
    canonical_state: false,
    perspective_ref: inputOptions.perspective_ref,
    bounded_summary: inputOptions.marker,
    as_of: generatedAt,
    items: [
      {
        item_kind: "frame",
        summary: inputOptions.marker,
        source_refs: ["source:project-home-a"],
        external_refs: [],
        currentness,
      },
    ],
    source_refs: ["source:project-home-a"],
    external_refs: [],
    currentness,
    warnings: [],
  };
  input.gaps = [];
  const packet = buildTaskContextPacketV01(input);
  insertVNextCoreRecordV01(database, {
    record_kind: "task_context_packet",
    record_id: packet.packet_id,
    workspace_id: packet.workspace_id,
    project_id: packet.project_id,
    fingerprint: packet.integrity.fingerprint,
    idempotency_key: null,
    payload: packet,
    created_at: packet.generated_at,
  });
  return packet;
}

function insertRunReceipt(
  database: Database.Database,
  project: SemanticReviewLoopProjectFixtureV01,
) {
  const baseReceipt = buildDurableLocalClosedLoopM3APrefixFixtureV01(project).run_receipt;
  const workRef = baseReceipt.work_ref ?? {
    ref_version: "external_ref.v0.1" as const,
    ref_type: "work",
    external_id: `work:project-home:${project.project_id}`,
    observed_at: baseReceipt.recorded_at,
    trust_class: "direct_local_observation" as const,
  };
  const modelInvocationReceipt = modelInvocationReceiptFixtureV02({
    workspace_id: baseReceipt.workspace_id,
    project_id: baseReceipt.project_id,
    work_id: workRef.external_id,
    run_id: baseReceipt.run_id,
    started_at: baseReceipt.started_at ?? baseReceipt.recorded_at,
    finished_at: baseReceipt.finished_at ?? baseReceipt.recorded_at,
  });
  const modelEntry = projectModelInvocationReceiptToRunReceiptEntryV02({
    receipt: modelInvocationReceipt,
    workspace_id: baseReceipt.workspace_id,
    project_id: baseReceipt.project_id,
    work_id: workRef.external_id,
    run_id: baseReceipt.run_id,
  });
  assert.throws(
    () =>
      projectModelInvocationReceiptToRunReceiptEntryV02({
        receipt: modelInvocationReceipt,
        workspace_id: baseReceipt.workspace_id,
        project_id: `${baseReceipt.project_id}:cross-project`,
        work_id: workRef.external_id,
        run_id: baseReceipt.run_id,
      }),
    (error) =>
      error instanceof ModelInvocationRunReceiptProjectionErrorV02 &&
      error.code === "model_invocation_projection_scope_mismatch",
  );
  const receipt = buildRunReceiptV01({
    ...baseReceipt,
    work_ref: workRef,
    model_invocations: [modelEntry, clone(modelEntry)],
  });
  insertVNextCoreRecordV01(database, {
    record_kind: "run_receipt",
    record_id: receipt.receipt_id,
    workspace_id: receipt.workspace_id,
    project_id: receipt.project_id,
    fingerprint: receipt.integrity.fingerprint,
    idempotency_key: receipt.idempotency_key,
    payload: receipt,
    created_at: receipt.recorded_at,
  });
  return receipt;
}

function insertFailedRunReceipt(
  database: Database.Database,
  project: SemanticReviewLoopProjectFixtureV01,
) {
  const input = clone(
    genericCliDirectObservationInputFixture,
  ) as RunReceiptBuilderInputV01;
  input.workspace_id = project.workspace_id;
  input.project_id = project.project_id;
  input.run_id = `run-project-home-failed-${project.project_id}`;
  input.task_context_packet_ref = null;
  input.recorded_at = "2026-07-15T09:08:00.000Z";
  input.verification.status = "failed";
  input.checks = input.checks.map((check) => ({
    ...check,
    status: check.required ? "failed" : check.status,
    summary: check.required
      ? "The required Project Home verification check failed."
      : check.summary,
  }));
  input.result_summary = {
    ...input.result_summary,
    summary: "The latest result requires verification attention.",
    outcome: "Required verification failed.",
  };
  const receipt = buildRunReceiptV01(input);
  insertVNextCoreRecordV01(database, {
    record_kind: "run_receipt",
    record_id: receipt.receipt_id,
    workspace_id: receipt.workspace_id,
    project_id: receipt.project_id,
    fingerprint: receipt.integrity.fingerprint,
    idempotency_key: receipt.idempotency_key,
    payload: receipt,
    created_at: receipt.recorded_at,
  });
  return receipt;
}

function modelInvocationReceiptFixtureV02(input: {
  workspace_id: string;
  project_id: string;
  work_id: string;
  run_id: string;
  started_at: string;
  finished_at: string;
}): ModelInvocationReceiptV02 {
  return {
    receipt_version: "model_invocation_receipt.v0.2",
    gateway_version: "model_gateway.v0.1",
    invocation_id: `model-invocation:${input.run_id}`,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    work_id: input.work_id,
    run_id: input.run_id,
    purpose: "planner_plan",
    invocation_origin: "policy_triggered",
    attempted_implementation_id: null,
    attempted_implementation_version: null,
    attempted_provider_ref: null,
    attempted_model_ref: null,
    final_implementation_id: "deterministic.project-home-result-test",
    final_implementation_version: "deterministic_project_home_result_test.v0.1",
    requested_mode: "deterministic",
    execution_mode: "deterministic",
    selection_reason: "explicit_deterministic",
    started_at: input.started_at,
    finished_at: input.finished_at,
    latency_ms: Date.parse(input.finished_at) - Date.parse(input.started_at),
    status: "completed",
    outcome: "deterministic_success",
    egress_attempted: false,
    egress_status: "did_not_occur",
    egress_policy_version: "model_gateway_egress_policy.v0.1",
    usage: null,
    cost: {
      basis: "unavailable",
      amount: null,
      currency: null,
      source: "no_pricing_authority",
    },
    budget: {
      decision: "not_used",
      input_bytes_limit: 4096,
      input_bytes_used: null,
      output_tokens_limit: 512,
      output_tokens_used: null,
      provider_call_limit: 0,
      provider_calls_used: 0,
      timeout_limit_ms: 30_000,
      timeout_disposition: "completed_within_deadline",
    },
    cancellation_disposition: "not_cancelled",
    failure_code: null,
    data_classification: "local_only",
    retention_class: "none",
    privacy_decision: "provider_egress_not_used",
    provenance_refs: ["test:project-home-result"],
    grant_lineage_ref: {
      ref_version: "external_ref.v0.1",
      ref_type: "model_invocation_capability_grant",
      external_id: `model-grant:${input.run_id}`,
      observed_at: input.started_at,
      source_ref: `sha256:${"8".repeat(64)}`,
      trust_class: "direct_local_observation",
    },
    automation_control_lineage_ref: {
      ref_version: "external_ref.v0.1",
      ref_type: "project_automation_control",
      external_id: `${input.project_id}:automation-control:1`,
      observed_at: input.started_at,
      source_ref: "control-revision:1",
      trust_class: "direct_local_observation",
    },
    fallback_used: false,
    coverage_class: "enforced",
    trust_class: "direct_local_observation",
    raw_prompt_persisted: false,
    raw_response_persisted: false,
    hidden_reasoning_persisted: false,
    receipt_is_semantic_authority: false,
  };
}

function insertLegacyWorkItem(database: Database.Database) {
  database.prepare(
    `INSERT INTO work_items (
      work_id, scope, title, status, priority, summary, next_action,
      user_attention_required, related_state_keys, links, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    "AG-PROJECT-HOME-LEGACY",
    LEGACY_AUGNES_PROJECT_SCOPE_V01,
    legacyMarker,
    "planned",
    "normal",
    legacyMarker,
    "Remain in explicit compatibility scope.",
    0,
    "[]",
    "{}",
    fixedGeneratedAt,
    fixedGeneratedAt,
  );
}

const snapshotTables = [
  "vnext_workspace_identities",
  "vnext_project_identities",
  "vnext_project_root_bindings",
  "vnext_project_external_ref_bindings",
  "vnext_recent_projects",
  "vnext_active_project_selections",
  "vnext_project_automation_controls",
  "vnext_project_personal_perspective_scopes",
  "vnext_core_records",
  "vnext_semantic_state_entries",
  "vnext_semantic_target_heads",
  "work_items",
] as const;

function databaseSnapshot(database: Database.Database) {
  return Object.fromEntries(
    snapshotTables.map((table) => [
      table,
      database.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all(),
    ]),
  );
}

function fixedClock(...timestamps: string[]) {
  let index = 0;
  return {
    now() {
      const value = timestamps[Math.min(index, timestamps.length - 1)]!;
      if (index < timestamps.length - 1) index += 1;
      return value;
    },
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function historyGrowthRegression() {
  const observations: unknown[] = [];
  const failures: string[] = [];
  const kinds = process.argv.includes("--history-writer-cost-only")
    ? ["decision"] as const : ["proposal", "decision", "transition"] as const;
  for (const kind of kinds) {
    const database = new Database(":memory:");
    try {
      database.pragma("foreign_keys = ON");
      applyCanonicalDatabaseMigrations(database);
      const localRoot = path.join(root, `history-${kind}`);
      mkdirSync(localRoot);
      const workspace = getOrCreateDefaultWorkspaceIdentityV01(database);
      const registration = getOrCreateCanonicalProjectForLocalRootV01(database, {
        workspace_id: workspace.workspace_id,
        local_root: normalizeLocalProjectRootRefV01(localRoot, { base_path: root }),
        display_name: `History ${kind}`,
      });
      const project = projectFixture(
        registration.project.project_id,
        workspace.workspace_id,
        `history-${kind}`,
      );
      const material = buildDurableLocalClosedLoopM3APrefixFixtureV01(project);
      for (const [recordKind, payload, id, createdAt, key] of [
        [
          "task_context_packet",
          material.prior_packet,
          material.prior_packet.packet_id,
          material.prior_packet.generated_at,
          null,
        ],
        [
          "run_receipt",
          material.run_receipt,
          material.run_receipt.receipt_id,
          material.run_receipt.recorded_at,
          material.run_receipt.idempotency_key,
        ],
      ] as const) {
        insertVNextCoreRecordV01(database, {
          ...project,
          record_kind: recordKind,
          record_id: id,
          fingerprint: payload.integrity.fingerprint,
          payload,
          created_at: createdAt,
          idempotency_key: key,
        });
      }
      const singleProposal = rebuildProposal(project, "History candidate", "history");
      if (kind === "decision") insertPendingProposal(database, singleProposal);
      let transitionProposal = singleProposal;
      let firstClaim: ClaimRecordV01 | undefined;
      let firstApplied: ReturnType<typeof persistHistoryOperatorTransition> | undefined;
      let latestWritten: ReturnType<typeof persistHistoryOperatorDecision> | undefined;
      const boundaries = kind === "proposal" ? [1, 63, 64, 65] : [1, 127, 128, 129];
      for (let count = 1; count <= boundaries.at(-1)!; count += 1) {
        if (kind === "transition" && count % 3 === 2) {
          const source = rebuildProposal(project, `Applied history ${count}`, `applied-${count}`);
          source.proposed_deltas = Array.from({ length: 3 }, (_, index) => ({
            ...clone(source.proposed_deltas[0]!),
            candidate_id: `delta:history-${count}-${index}`,
            target_refs: source.proposed_deltas[0]!.target_refs.map((ref) => ({
              ...ref,
              external_id: `${ref.external_id}:history-${count}-${index}`,
            })),
          }));
          for (const item of [...source.missing_information, ...source.uncertainties]) {
            item.related_delta_ids = source.proposed_deltas.map(
              (candidate) => candidate.candidate_id,
            );
          }
          transitionProposal = buildEpisodeDeltaProposalV01(source);
        }
        let proposal =
          kind === "proposal"
            ? rebuildProposal(project, `Resolved history ${count}`, `history-${count}`)
            : kind === "transition"
              ? transitionProposal
              : singleProposal;
        if (kind === "transition") {
          let candidateIndex = (count - 2) % 3;
          if (count === 1 || count === 129) {
            const claim = historyClaim(project, count === 129 ? firstClaim : undefined);
            if (count === 1) firstClaim = claim;
            admitClaimRecordV01(database, { ...project, claim });
            const lifecycle = materializeProjectVerifyClaimLifecycleProposalV01(database, {
              ...project, claim_id: claim.claim_id,
              observed_at: historyWrittenAt(count),
            });
            proposal = admitProjectVerifyLifecycleProposalV01(database, lifecycle).proposal;
            candidateIndex = 0;
          }
          const written = persistHistoryOperatorTransition(database, project, proposal, candidateIndex, count);
          latestWritten = written;
          if (count === 1) firstApplied = written;
          if (count === 129) {
            assert.deepEqual(written.recorded.decision.lineage.prior_decisions, [{
              decision_id: firstApplied!.recorded.decision.decision_id,
              decision_fingerprint: firstApplied!.recorded.decision.integrity.fingerprint,
            }], "normal lifecycle writer resolves the first applied decision across pages");
            assert.equal(written.applied.status, "applied");
            const beforeStale = historyReadSnapshot(database);
            assert.throws(() => prepareVNextOperatorPilotSemanticCommitPreviewV01(database, {
              config: firstApplied!.config, credential: firstApplied!.credential,
              clock: fixedClock(historyWrittenAt(129)), request: firstApplied!.binding,
            }), /pilot_add_requires_observed_absent_state/,
            "the old create decision cannot reapply after a normal revision");
            assert.deepEqual(historyReadSnapshot(database), beforeStale);
          }
        } else if (kind === "decision") {
          latestWritten = persistHistoryOperatorDecision(database, project, proposal, 0, count, "reject");
        } else {
          persistVNextSemanticReviewMaterialV01(database, {
            proposal, decision: buildDecision(project, proposal, "reject"),
          });
        }
        if (!boundaries.includes(count)) continue;
        const before = historyReadSnapshot(database);
        let strictError: string | null = null;
        try {
          readProjectHomeDatabaseCompatibilityV01(database, project, {
            now: () => fixedGeneratedAt,
          });
        } catch (error) {
          strictError = (error as Error).message;
        }
        const home = await readProjectHomeProjectionV01(database, project, {
          now: () => fixedGeneratedAt,
        });
        const recovery = kind === "transition" && count !== 129
          ? null : validateRecoveryCanonicalDatabaseV01(database);
        if (recovery) assert.equal(recovery.status, "valid", `${kind}:${count}:${recovery.code}`);
        let inspectorCompleteness: string | null = null;
        let workbenchChains: number | null = null;
        // Full consumer agreement is checked at 129. The intermediate applied
        // boundaries retain strict Home readback without repeating every owner.
        if (kind !== "transition" || count === 129) {
          const config = historyConfig(project);
          const detail = readVNextOperatorPilotSemanticReviewV01(database, {
            config, proposal_id: proposal.proposal_id,
            authenticated_session_id: latestWritten?.credential.session_id ?? null,
          });
          const continuity = projectVNextOperatorPilotContinuityV01(database, {
            config, clock: { now: () => fixedGeneratedAt },
          });
          const workbench = readVNextOperatorPilotProposalDurableLineageV01(database, {
            config, proposal, clock: { now: () => fixedGeneratedAt },
          });
          const inspector = readSharedProjectInspectorV01(database, {
            config, authenticated_session_id: latestWritten?.credential.session_id ?? "session:history",
            observed_at: fixedGeneratedAt,
            target: { target_kind: "episode_delta_proposal", record_id: proposal.proposal_id,
              expected_fingerprint: proposal.integrity.fingerprint },
          });
          inspectorCompleteness = inspector.completeness;
          workbenchChains = workbench.chains.length;
          assert.equal(inspector.authority.read_only, true);
          assert.equal(workbench.read_only, true);
          assert.notEqual(inspector.target_status, "conflict");
          if (kind === "decision") {
            assert.equal(detail.decision_count, count);
            assert.equal(detail.history_read!.decisions.complete, count <= 128);
            assert.equal(detail.decision_application_summary.status, "rejected");
            assert.equal(detail.decision_application_summary.effective_decision?.decision_id, latestWritten!.recorded.decision.decision_id);
            assert.equal(continuity.pending_accepted_decision_count, 0);
            assert.equal(workbench.chains.length, 0);
            assert.equal(home.attention.decision_debt.pending_candidate_count, 0);
          }
          if (kind === "transition") {
            assert.equal(detail.decision_application_summary.status, "project_updated");
            assert.equal(continuity.latest_applied_transition?.decision_id, latestWritten!.recorded.decision.decision_id);
            assert.equal(continuity.pending_accepted_decision_count, 0);
            assert(workbench.chains.some((chain) => chain.transition.decision_id === latestWritten!.recorded.decision.decision_id));
            assert.equal(home.attention.decision_debt.accepted_awaiting_transition_count, 0);
          }
        }
        const observation = {
          kind,
          count,
          normal_decision_writer: kind !== "proposal",
          normal_transition_writer: kind === "transition",
          inspector: inspectorCompleteness,
          workbench_chains: workbenchChains,
          strict_error: strictError,
          attention: home.attention.state.status,
          debt: home.attention.decision_debt,
          recovery,
        };
        observations.push(observation);
        console.log(JSON.stringify(observation));
        assert.deepEqual(
          historyReadSnapshot(database),
          before,
          "history readers do not mutate canonical or projection state",
        );
        if (strictError || home.attention.state.status === "error") {
          failures.push(
            `${kind}:${count}:${strictError}:${home.attention.state.status}:${recovery?.code}`,
          );
        }
      }
      if (!process.argv.includes("--history-boundaries-only")) {
        if (kind === "proposal") await longHistoryAttentionRegression(database, project);
        if (kind === "decision") {
          await invalidHistoryRegression(database, project);
          await normalWriterLargerHistoryRegression(database, project, singleProposal, latestWritten!);
        }
        if (kind === "transition") await invalidTransitionHistoryRegression(database, project);
      }
    } finally {
      database.close();
    }
  }
  console.log(JSON.stringify({ history_growth_boundaries: observations }));
  assert.deepEqual(failures, [], "valid cumulative history remains readable");
}

async function longHistoryAttentionRegression(
  database: Database.Database,
  project: SemanticReviewLoopProjectFixtureV01,
) {
  const make = (marker: string, createdAt = "2026-07-10T11:59:59.000Z") =>
    buildEpisodeDeltaProposalV01({
      ...rebuildProposal(project, marker, marker),
      created_at: createdAt,
    });
  const pending = make("Old unresolved candidate");
  const accepted = make("Old accepted awaiting Transition");
  insertPendingProposal(database, pending);
  persistVNextSemanticReviewMaterialV01(database, {
    proposal: accepted,
    decision: buildDecision(project, accepted, "accept"),
  });
  for (const [marker, revisit] of [
    [
      "Old revisit",
      { revisit_at: "2026-07-16T00:00:00.000Z", expires_at: null, condition_summary: null },
    ],
    [
      "Old expiry",
      { revisit_at: null, expires_at: "2026-07-17T00:00:00.000Z", condition_summary: null },
    ],
    [
      "Old condition",
      { revisit_at: null, expires_at: null, condition_summary: "Wait for the recorded condition." },
    ],
  ] as const) {
    const proposal = make(marker);
    persistVNextSemanticReviewMaterialV01(database, {
      proposal,
      decision: buildDecision(project, proposal, "defer", { revisit }),
    });
  }
  for (const [at, pendingCount, deferredCount] of [
    [fixedGeneratedAt, 1, 3],
    ["2026-07-16T00:00:00.000Z", 2, 2],
    ["2026-07-17T00:00:00.000Z", 3, 1],
  ] as const) {
    const before = databaseSnapshot(database);
    const home = await readProjectHomeProjectionV01(database, project, { now: () => at });
    assert.deepEqual(home.attention.decision_debt, {
      pending_candidate_count: pendingCount,
      accepted_awaiting_transition_count: 1,
      deferred_candidate_count: deferredCount,
    });
    if (at === fixedGeneratedAt)
      assert(
        home.attention.items.some((item) => item.proposal_id === pending.proposal_id),
        "the old unresolved item is outside the recent 64 proposals",
      );
    assert.equal(
      readProjectHomeDatabaseCompatibilityV01(database, project, { now: () => at }).read_compatible,
      true,
    );
    assert.equal(validateRecoveryCanonicalDatabaseV01(database).status, "valid");
    assert.deepEqual(databaseSnapshot(database), before);
  }
  // Conversely, recent unresolved work must remain visible among old resolved
  // history. Counts describe the complete queue even when only five are shown.
  for (let index = 0; index < 8; index += 1)
    insertPendingProposal(database, make(`Recent unresolved ${index}`, "2026-07-10T13:14:00.000Z"));
  const home = await readProjectHomeProjectionV01(database, project, {
    now: () => fixedGeneratedAt,
  });
  assert.equal(home.attention.decision_debt.pending_candidate_count, 9);
  assert.equal(home.attention.decision_debt.accepted_awaiting_transition_count, 1);
  assert.equal(home.attention.items.length, 5);
  assert(home.attention.total_count >= 10);

  await invalidHistoryRegression(database, project);
  for (let count = 66; count <= 512; count += 1) {
    const proposal = make(`Resolved larger history ${count}`, "2026-07-10T12:00:00.000Z");
    persistVNextSemanticReviewMaterialV01(database, {
      proposal,
      decision: buildDecision(project, proposal, "reject"),
    });
  }
  let recordsRead = 0;
  let bytesRead = 0;
  let maxBatch = 0;
  const before = databaseSnapshot(database);
  const prepare = database.prepare;
  database.prepare = ((sql: string) => {
    const statement = prepare.call(database, sql);
    if (!/SELECT\s+\*\s+FROM\s+vnext_core_records/i.test(sql)) return statement;
    return new Proxy(statement, {
      get(target, key) {
        if (key !== "get" && key !== "all") {
          const value = Reflect.get(target, key);
          return typeof value === "function" ? value.bind(target) : value;
        }
        return (...args: unknown[]) => {
          const result = Reflect.apply(target[key], target, args);
          const rows =
            key === "all"
              ? (result as { payload_json: string }[])
              : result
                ? [result as { payload_json: string }]
                : [];
          recordsRead += rows.length;
          bytesRead += rows.reduce((sum, row) => sum + Buffer.byteLength(row.payload_json), 0);
          maxBatch = Math.max(maxBatch, rows.length);
          return result;
        };
      },
    });
  }) as typeof database.prepare;
  const started = performance.now();
  try {
    assert.equal(
      readProjectHomeDatabaseCompatibilityV01(database, project, { now: () => fixedGeneratedAt })
        .read_compatible,
      true,
    );
  } finally {
    database.prepare = prepare;
  }
  const elapsedMs = performance.now() - started;
  assert(maxBatch <= 64, "history never materializes an unbounded record batch");
  assert(
    recordsRead > 512,
    "measurement includes the complete history, not only its recent window",
  );
  assert.deepEqual(databaseSnapshot(database), before);
  console.log(
    JSON.stringify({
      larger_history: {
        proposals: 525,
        decisions: 516,
        records_read: recordsRead,
        payload_bytes_read: bytesRead,
        max_batch: maxBatch,
        elapsed_ms: Math.round(elapsedMs),
      },
      full_recovery: "larger_home_cost_sample_only; normal_writer_recovery_verified_at_129",
    }),
  );
}

async function invalidHistoryRegression(
  database: Database.Database,
  project: SemanticReviewLoopProjectFixtureV01,
) {
  for (const mutation of [
    "fingerprint",
    "missing_proposal",
    "foreign_proposal",
    "missing_prior",
    "conflicting_prior",
  ] as const) {
    const copy = new Database(database.serialize());
    try {
      copy.exec(
        "DROP TRIGGER trg_vnext_core_records_immutable_update; DROP TRIGGER trg_vnext_core_records_immutable_delete;",
      );
      if (mutation === "fingerprint")
        copy
          .prepare(
            "UPDATE vnext_core_records SET payload_json = json_set(payload_json, '$.bounded_summary', 'tampered') WHERE record_id = (SELECT record_id FROM vnext_core_records WHERE record_kind = 'episode_delta_proposal' ORDER BY created_at, record_id LIMIT 1)",
          )
          .run();
      if (mutation === "missing_proposal")
        copy
          .prepare(
            "DELETE FROM vnext_core_records WHERE record_id = (SELECT json_extract(payload_json, '$.source_proposal.proposal_id') FROM vnext_core_records WHERE record_kind = 'review_decision' LIMIT 1)",
          )
          .run();
      if (mutation === "foreign_proposal") {
        const foreignRoot = path.join(root, "foreign-history");
        mkdirSync(foreignRoot, { recursive: true });
        const registration = getOrCreateCanonicalProjectForLocalRootV01(copy, {
          workspace_id: project.workspace_id,
          local_root: normalizeLocalProjectRootRefV01(foreignRoot, { base_path: root }),
          display_name: "Foreign history",
        });
        const foreign = projectFixture(
          registration.project.project_id,
          project.workspace_id,
          "foreign-history",
        );
        const material = buildDurableLocalClosedLoopM3APrefixFixtureV01(foreign);
        for (const [kind, payload, id, at, key] of [
          [
            "task_context_packet",
            material.prior_packet,
            material.prior_packet.packet_id,
            material.prior_packet.generated_at,
            null,
          ],
          [
            "run_receipt",
            material.run_receipt,
            material.run_receipt.receipt_id,
            material.run_receipt.recorded_at,
            material.run_receipt.idempotency_key,
          ],
          [
            "episode_delta_proposal",
            material.proposal,
            material.proposal.proposal_id,
            material.proposal.created_at,
            null,
          ],
        ] as const)
          insertVNextCoreRecordV01(copy, {
            ...foreign,
            record_kind: kind,
            record_id: id,
            fingerprint: payload.integrity.fingerprint,
            payload,
            created_at: at,
            idempotency_key: key,
          });
        const decision = buildReviewDecisionV01({
          ...buildDecision(foreign, material.proposal, "reject"),
          project_id: project.project_id,
        });
        assert.equal(validateReviewDecisionV01(decision).status, "valid");
        assert.equal(
          validateReviewDecisionAgainstEpisodeDeltaProposalV01(decision, material.proposal).status,
          "blocked",
        );
        insertVNextCoreRecordV01(copy, {
          ...project,
          record_kind: "review_decision",
          record_id: decision.decision_id,
          fingerprint: decision.integrity.fingerprint,
          payload: decision,
          created_at: decision.decided_at,
          idempotency_key: null,
        });
      }
      if (mutation === "missing_prior" || mutation === "conflicting_prior") {
        const record = copy
          .prepare(
            "SELECT payload_json FROM vnext_core_records WHERE record_kind = 'review_decision' ORDER BY created_at, record_id LIMIT 1",
          )
          .get() as { payload_json: string };
        const prior = JSON.parse(record.payload_json) as ReviewDecisionV01;
        const decision = buildReviewDecisionV01({
          ...prior,
          decided_at: "2026-07-11T00:00:00.000Z",
          lineage: {
            ...prior.lineage,
            prior_decisions: [
              {
                decision_id:
                  mutation === "missing_prior"
                    ? `review-decision:${"f".repeat(64)}`
                    : prior.decision_id,
                decision_fingerprint:
                  mutation === "missing_prior"
                    ? prior.integrity.fingerprint
                    : `sha256:${"f".repeat(64)}`,
              },
            ],
          },
        });
        assert.equal(validateReviewDecisionV01(decision).status, "valid");
        insertVNextCoreRecordV01(copy, {
          record_kind: "review_decision",
          record_id: decision.decision_id,
          workspace_id: decision.workspace_id,
          project_id: decision.project_id,
          fingerprint: decision.integrity.fingerprint,
          payload: decision,
          created_at: decision.decided_at,
          idempotency_key: null,
        });
      }
      for (const row of database
        .prepare(
          "SELECT sql FROM sqlite_master WHERE name IN ('trg_vnext_core_records_immutable_update', 'trg_vnext_core_records_immutable_delete')",
        )
        .all() as { sql: string }[])
        copy.exec(row.sql);
      assert.throws(
        () =>
          readProjectHomeDatabaseCompatibilityV01(copy, project, { now: () => fixedGeneratedAt }),
        /project_home_|binding/,
      );
      const home = await readProjectHomeProjectionV01(copy, project, {
        now: () => fixedGeneratedAt,
      });
      assert.equal(
        home.attention.state.status,
        "error",
        `${mutation} cannot become empty/complete attention`,
      );
      assert.equal(validateRecoveryCanonicalDatabaseV01(copy).status, "invalid");
    } finally {
      copy.close();
    }
  }
}

async function invalidTransitionHistoryRegression(
  database: Database.Database,
  project: SemanticReviewLoopProjectFixtureV01,
) {
  const copy = new Database(database.serialize());
  try {
    copy.exec("DROP TRIGGER trg_vnext_core_records_immutable_delete;");
    copy
      .prepare(
        "DELETE FROM vnext_core_records WHERE record_kind = 'semantic_commit_gate' AND record_id = (SELECT record_id FROM vnext_core_records WHERE record_kind = 'semantic_commit_gate' ORDER BY created_at, record_id LIMIT 1)",
      )
      .run();
    copy.exec(
      (
        database
          .prepare(
            "SELECT sql FROM sqlite_master WHERE name = 'trg_vnext_core_records_immutable_delete'",
          )
          .get() as { sql: string }
      ).sql,
    );
    assert.throws(() =>
      readProjectHomeDatabaseCompatibilityV01(copy, project, { now: () => fixedGeneratedAt }),
    );
    const home = await readProjectHomeProjectionV01(copy, project, { now: () => fixedGeneratedAt });
    assert.equal(
      home.attention.state.status,
      "error",
      "a missing historical authority gate is still refused outside the first page",
    );
    assert.equal(validateRecoveryCanonicalDatabaseV01(copy).status, "invalid");
    const config = historyConfig(project);
    assert.throws(() => projectVNextOperatorPilotContinuityV01(copy, { config, clock: fixedClock(fixedGeneratedAt) }));
    const row = copy.prepare("SELECT payload_json FROM vnext_core_records WHERE record_kind = 'episode_delta_proposal' ORDER BY created_at DESC LIMIT 1").get() as { payload_json: string };
    const proposal = JSON.parse(row.payload_json) as EpisodeDeltaProposalV01;
    assert.throws(() => readVNextOperatorPilotProposalDurableLineageV01(copy, { config, proposal, clock: fixedClock(fixedGeneratedAt) }));
    assert.throws(() => readSharedProjectInspectorV01(copy, {
      config, authenticated_session_id: "session:history", observed_at: fixedGeneratedAt,
      target: { target_kind: "episode_delta_proposal", record_id: proposal.proposal_id, expected_fingerprint: proposal.integrity.fingerprint },
    }));
  } finally {
    copy.close();
  }
}

async function normalWriterLargerHistoryRegression(
  database: Database.Database,
  project: SemanticReviewLoopProjectFixtureV01,
  proposal: EpisodeDeltaProposalV01,
  latest: ReturnType<typeof persistHistoryOperatorDecision>,
) {
  const request = {
    proposal_id: proposal.proposal_id, proposal_fingerprint: proposal.integrity.fingerprint,
    candidate_id: latest.recorded.decision.candidate.candidate_id,
    candidate_fingerprint: latest.recorded.decision.candidate.candidate_fingerprint,
    decision: "reject", rationale_summary: latest.recorded.decision.rationale_summary, revisit: null,
  };
  const before = databaseSnapshot(database);
  const sessionsBefore = database.prepare("SELECT * FROM vnext_local_operator_sessions ORDER BY session_id").all();
  for (const attempt of [
    { ...latest, request: { ...request, proposal_fingerprint: `sha256:${"f".repeat(64)}` } },
    { ...latest, request: { ...request, candidate_fingerprint: `sha256:${"f".repeat(64)}` } },
    { ...latest, request, config: { ...latest.config, project_id: "foreign-history" } },
    { ...latest, request, clock: fixedClock("2026-07-20T00:00:00.000Z") },
  ]) {
    assert.throws(() => recordVNextOperatorPilotReviewDecisionV01(database, attempt));
  }
  assert.deepEqual(databaseSnapshot(database), before);
  assert.deepEqual(database.prepare("SELECT * FROM vnext_local_operator_sessions ORDER BY session_id").all(), sessionsBefore,
    "invalid scope, fingerprint and expired authority do not consume a nonce");
  const replay = recordVNextOperatorPilotReviewDecisionV01(database, { ...latest, request });
  assert.equal(replay.status, "exact_replay");
  assert.equal(replay.decision.decision_id, latest.recorded.decision.decision_id);
  assert.deepEqual(databaseSnapshot(database), before);
  assert.throws(() => recordVNextOperatorPilotReviewDecisionV01(database, { ...latest, request }), /nonce|session/,
    "a consumed action nonce cannot be reused");

  // The default owner retains every required 127/128/129 and negative case.
  // The additional normal-writer cost sample is a focused mode of this same
  // disposable fixture, keeping Canonical within its existing lifecycle budget.
  const finalCount = process.argv.includes("--history-writer-cost-only") ? 193 : 129;
  for (let count = 130; count <= finalCount; count += 1) {
    latest = persistHistoryOperatorDecision(database, project, proposal, 0, count, "reject");
  }
  const config = historyConfig(project);
  const snapshot = historyReadSnapshot(database);
  let rowsRead = 0;
  let maxBatch = 0;
  const prepare = database.prepare;
  database.prepare = ((sql: string) => {
    const statement = prepare.call(database, sql);
    if (!/SELECT\s+\*\s+FROM\s+vnext_core_records/i.test(sql)) return statement;
    return new Proxy(statement, {
      get(target, key) {
        if (key !== "get" && key !== "all") {
          const value = Reflect.get(target, key);
          return typeof value === "function" ? value.bind(target) : value;
        }
        return (...args: unknown[]) => {
          const result = Reflect.apply(target[key], target, args);
          const count = key === "all" ? (result as unknown[]).length : result ? 1 : 0;
          rowsRead += count;
          maxBatch = Math.max(maxBatch, count);
          return result;
        };
      },
    });
  }) as typeof database.prepare;
  const started = performance.now();
  try {
    const detail = readVNextOperatorPilotSemanticReviewV01(database, {
      config, proposal_id: proposal.proposal_id, authenticated_session_id: latest.credential.session_id,
    });
    assert.equal(detail.decision_count, finalCount);
    assert.equal(detail.history_read!.decisions.complete, false);
    assert.equal(detail.decisions.length, 128);
    const first = database.prepare("SELECT record_id FROM vnext_core_records WHERE record_kind = 'review_decision' ORDER BY created_at, record_id LIMIT 1").get() as { record_id: string };
    assert(!detail.decisions.some((entry) => entry.decision_id === first.record_id));
    const exactOldDecision = readVNextOperatorPilotReviewDecisionV01(database, config, proposal, first.record_id);
    assert.equal(exactOldDecision?.decision_id, first.record_id, "exact bindings remain readable outside the display window");
    assert.equal(detail.decision_application_summary.effective_decision?.decision_id, latest.recorded.decision.decision_id);
    assert.deepEqual(detail.decision_application_summary, deriveVNextOperatorPilotProposalDecisionApplicationSummaryV01({
      source_currentness: detail.source_currentness, candidate_admissions: detail.candidate_admissions,
      decision_history: detail.decision_history, transition_receipts: detail.transition_receipts,
    }));
    projectVNextOperatorPilotContinuityV01(database, { config, clock: fixedClock(fixedGeneratedAt) });
  } finally {
    database.prepare = prepare;
  }
  assert(maxBatch <= 64);
  assert(rowsRead > finalCount);
  const elapsedMs = performance.now() - started;
  assert.deepEqual(historyReadSnapshot(database), snapshot);
  assert.equal(validateRecoveryCanonicalDatabaseV01(database).status, "valid");
  console.log(JSON.stringify({ normal_writer_larger_history: {
    decisions: finalCount, reader_rows: rowsRead, max_batch: maxBatch,
    review_and_continuity_ms: Math.round(elapsedMs),
  } }));
}

function historyReadSnapshot(database: Database.Database) {
  return {
    ...databaseSnapshot(database),
    sessions: database.prepare("SELECT * FROM vnext_local_operator_sessions ORDER BY session_id").all(),
  };
}

function historyConfig(project: SemanticReviewLoopProjectFixtureV01) {
  return { ...project, enabled: true as const, operator_id: "operator:history", database_path: ":memory:" };
}

function historyWrittenAt(count: number) {
  return new Date(Date.parse("2026-07-10T13:15:00.000Z") + count * 1000).toISOString();
}

function historyClaim(project: SemanticReviewLoopProjectFixtureV01, prior?: ClaimRecordV01) {
  const subject = {
    ref_version: "external_ref.v0.1" as const, ref_type: "project_verify_subject",
    external_id: "subject:history", trust_class: "user_declaration" as const,
    observed_at: "2026-07-10T13:00:00.000Z",
  };
  return buildClaimRecordV01({
    ...project,
    family_origin: { origin_namespace: "augnes.test.history.v0.1", origin_seed: "history",
      origin_profile: "history-user-candidate.v0.1", origin_producer_kind: "user" },
    revision: prior ? 2 : 1,
    prior_claim_ref: prior ? claimRecordReferenceV01(prior) : null,
    operation_intent: prior ? "revise" : "create",
    operation_target_claim_ref: null,
    proposition: prior ? "Revised history candidate." : "Initial history candidate.",
    subject_refs: [subject],
    applicability_scope: createClaimApplicabilityScopeV01({
      subject_refs: [subject], environment_refs: [subject],
      condition: { kind: "exact_context", value: "applicable", context_refs: [subject] },
    }),
    source_refs: [subject], limitations: ["Candidate material only."], uncertainty: ["Truth is not established."],
    producer: { producer_kind: "user", producer_profile: "history-user-candidate.v0.1" },
    created_at: prior ? historyWrittenAt(128) : subject.observed_at,
  });
}

function persistHistoryOperatorDecision(
  database: Database.Database,
  project: SemanticReviewLoopProjectFixtureV01,
  proposal: EpisodeDeltaProposalV01,
  candidateIndex: number,
  count: number,
  decision: "accept" | "reject" = "accept",
) {
  if (!proposal.project_verify_lifecycle) insertPendingProposal(database, proposal);
  const config = historyConfig(project);
  const clock = fixedClock(historyWrittenAt(count));
  const bootstrap = issueVNextLocalOperatorBootstrapV01(database, { config, clock });
  let credential = consumeVNextLocalOperatorBootstrapV01(database, {
    config,
    clock,
    bootstrap_token: bootstrap.bootstrap_token,
  }).credential;
  const candidate = proposal.proposed_deltas[candidateIndex]!;
  const recorded = recordVNextOperatorPilotReviewDecisionV01(database, {
    config,
    credential,
    clock,
    request: {
      proposal_id: proposal.proposal_id,
      proposal_fingerprint: proposal.integrity.fingerprint,
      candidate_id: candidate.candidate_id,
      candidate_fingerprint: createEpisodeDeltaCandidateFingerprintV01(candidate),
      decision,
      rationale_summary: `Review isolated history candidate ${count}.`,
      revisit: null,
    },
  });
  credential = readVNextLocalOperatorCredentialFromRequestV01(
    new Request("http://localhost/", {
      headers: {
        cookie: `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${recorded.session_cookie.value}`,
      },
    }),
  );
  const binding = {
    proposal_id: proposal.proposal_id,
    proposal_fingerprint: proposal.integrity.fingerprint,
    decision_id: recorded.decision.decision_id,
    decision_fingerprint: recorded.decision.integrity.fingerprint,
  };
  assert.equal(recorded.status, "inserted");
  return { config, clock, credential, binding, recorded };
}

function persistHistoryOperatorTransition(
  database: Database.Database,
  project: SemanticReviewLoopProjectFixtureV01,
  proposal: EpisodeDeltaProposalV01,
  candidateIndex: number,
  count: number,
) {
  const written = persistHistoryOperatorDecision(database, project, proposal, candidateIndex, count);
  const { config, clock, credential, binding } = written;
  if (count >= 127) console.log(JSON.stringify({ normal_writer_decision_inserted: count }));
  const preview = prepareVNextOperatorPilotSemanticCommitPreviewV01(database, {
    config,
    credential,
    clock,
    request: binding,
  });
  const confirmed = confirmVNextOperatorPilotSemanticCommitV01(database, {
    config,
    credential,
    clock,
    preview_binding_cookie: preview.preview_binding_cookie,
    request: { ...binding, confirmation_digest: preview.preview.confirmation_digest },
  });
  const applied = database.transaction(() =>
    commitVNextSemanticTransitionWithOperatorPilotCapabilityInsideTransactionV01(database, {
      workspace_id: project.workspace_id,
      project_id: project.project_id,
      ...binding,
      clock,
      gate_record_id: confirmed.gate_record.gate_record_id,
      gate_record_fingerprint: confirmed.gate_record.integrity.fingerprint,
      review_window_capability: createVNextOperatorPilotReviewWindowCapabilityV01({
        ...project,
        config: VNEXT_OPERATOR_PILOT_DEFAULT_REVIEW_WINDOW_CONFIG_V01,
      }),
    }),
  )();
  assert.equal(applied.status, "applied");
  return {
    ...written, applied,
    credential: readVNextLocalOperatorCredentialFromRequestV01(new Request("http://localhost/", {
      headers: { cookie: `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${confirmed.session_admission.cookie_value}` },
    })),
  };
}

async function main() {
  try {
    mkdirSync(emptyRoot);
    mkdirSync(projectARoot);
    mkdirSync(projectBRoot);
    mkdirSync(temporalReviewRoot);
    mkdirSync(contextReviewRoot);
    mkdirSync(recoveredProjectARoot);
    for (const projectRoot of [projectARoot, projectBRoot]) {
      mkdirSync(path.join(projectRoot, ".git"));
      writeFileSync(
        path.join(projectRoot, ".git", "config"),
        `[remote "origin"]\n  url = ${sharedRemote}\n`,
      );
      writeFileSync(path.join(projectRoot, "fixture.txt"), path.basename(projectRoot));
    }
    writeFileSync(path.join(recoveredProjectARoot, "recovery.txt"), "recovery fixture");

    process.env.AUGNES_CANONICAL_TEST_MODE = "1";
    process.env.AUGNES_CANONICAL_TEMP_ROOT = root;
    process.env.AUGNES_DB_PATH = dbPath;
    db = openDatabase();

    await historyGrowthRegression();
    if (process.argv.includes("--history-only") || process.argv.includes("--history-boundaries-only") || process.argv.includes("--history-writer-cost-only")) return;

    const pristineSnapshot = databaseSnapshot(db);
    assert.equal(readProjectHomeEntryDestinationV01(db), "/projects");
    assert.deepEqual(databaseSnapshot(db), pristineSnapshot, "root resolution without an active project is read-only");

    const emptyProject = await onboard(emptyRoot, "2026-07-15T09:01:00.000Z");
    const workspace = readDefaultWorkspaceIdentityV01(db);
    assert(workspace);
    const emptyBefore = databaseSnapshot(db);
    const emptyHome = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: emptyProject.project.project_id,
    }, { now: () => fixedGeneratedAt });
    assert.equal(emptyHome.project_summary.project.display_name, "Empty local project");
    assert.equal(emptyHome.project_summary.root_availability, "available");
    assert.equal(emptyHome.project_summary.is_active, true);
    assert.equal(emptyHome.accepted_state.state.status, "empty");
    assert.equal(emptyHome.working_projection.state.status, "empty");
    assert.equal(emptyHome.attention.state.status, "empty");
    assert.equal(emptyHome.recent_activity.state.status, "empty");
    assert.equal(emptyHome.automation.status, "not_configured");
    assert.equal(emptyHome.automation.admission_status, "not_configured");
    assert.equal(emptyHome.personal_perspective.status, "not_configured");
    assert.equal(emptyHome.personal_perspective.effectively_included, false);
    assert.equal(emptyHome.personal_perspective.task_basis, null);
    assert.equal(emptyHome.coordination.primary_action?.href, `/workbench/semantic-review?project_id=${encodeURIComponent(emptyHome.project_id)}`);
    assert.equal(
      emptyHome.coordination.primary_action?.entry_state,
      "project_review",
    );
    assert.equal(emptyHome.coordination.primary_action?.review_required, false);
    assert.deepEqual(emptyHome.coordination.primary_action?.source, {
      record_kind: "project_review",
      record_id: null,
    });
    assert.equal(emptyHome.coordination.projection_only, true);
    assert.equal(emptyHome.coordination.semantic_authority_granted, false);
    assert.equal(emptyHome.capabilities.items.length, 5);
    assert(emptyHome.capabilities.items.every((item) => item.status === "unavailable"));
    assert(emptyHome.next_moves.length > 0 && emptyHome.next_moves.length <= 3);
    assert.deepEqual(databaseSnapshot(db), emptyBefore, "empty Project Home reads create no rows");

    const compatibilityInput = clone(
      genericCliDirectObservationInputFixture,
    ) as RunReceiptBuilderInputV01;
    compatibilityInput.workspace_id = workspace.workspace_id;
    compatibilityInput.project_id = emptyProject.project.project_id;
    compatibilityInput.run_id = "run-project-home-manual-compatibility-001";
    compatibilityInput.recorded_at = "2026-07-10T08:30:00.000Z";
    compatibilityInput.task_context_packet_ref = null;
    compatibilityInput.compatibility.source_contracts = [
      "augnes.codex-result-report-ingestion.v0.1",
    ];
    compatibilityInput.compatibility.warnings = [
      "Canonical historical receipt retained after its manual producer was retired.",
    ];
    const compatibilityReceipt = buildRunReceiptV01(compatibilityInput);
    insertVNextCoreRecordV01(db, {
      record_kind: "run_receipt",
      record_id: compatibilityReceipt.receipt_id,
      workspace_id: compatibilityReceipt.workspace_id,
      project_id: compatibilityReceipt.project_id,
      fingerprint: compatibilityReceipt.integrity.fingerprint,
      idempotency_key: compatibilityReceipt.idempotency_key,
      payload: compatibilityReceipt,
      created_at: compatibilityReceipt.recorded_at,
    });
    const compatibilityHome = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: emptyProject.project.project_id,
    }, { now: () => fixedGeneratedAt });
    assert.equal(
      compatibilityHome.run_results.latest_result?.receipt_ref,
      compatibilityReceipt.receipt_id,
    );
    assert.equal(compatibilityHome.run_results.latest_result?.mode, "unknown");
    const compatibilityAttention = compatibilityHome.attention.items.find(
      (item) => item.attention_id === `result:${compatibilityReceipt.receipt_id}`,
    );
    assert(compatibilityAttention);
    assert.equal(compatibilityAttention.signals.includes("interactive"), false);
    assert.equal(
      compatibilityAttention.signals.includes("policy_triggered"),
      false,
    );
    const compatibilityResult = readProjectRunResultDetailV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: emptyProject.project.project_id,
      receipt_id: compatibilityReceipt.receipt_id,
    });
    assert.equal(compatibilityResult.packet.status, "not_recorded");
    assert.deepEqual(compatibilityResult.criterion_assessment, {
      status: "unavailable",
      reason: "packet_missing",
    });
    assert.equal(compatibilityResult.host.approvals.length, 0);
    assert.deepEqual(
      compatibilityResult.model_invocations.map((entry) => entry.state),
      ["none"],
    );
    assert.equal(
      compatibilityResult.compatibility.source_contracts.includes(
        "augnes.codex-result-report-ingestion.v0.1",
      ),
      true,
    );
    assert.equal(compatibilityResult.authority.semantic_state_changed, false);

    const policyInput = clone(
      genericCliDirectObservationInputFixture,
    ) as RunReceiptBuilderInputV01;
    policyInput.workspace_id = workspace.workspace_id;
    policyInput.project_id = emptyProject.project.project_id;
    policyInput.run_id = "run-project-home-policy-history-001";
    policyInput.recorded_at = "2026-07-10T08:31:00.000Z";
    policyInput.execution_environment.runtime_labels = [
      ...policyInput.execution_environment.runtime_labels.filter(
        (label) => label !== "interactive" && label !== "policy_triggered",
      ),
      "policy_triggered",
    ];
    const policyReceipt = buildRunReceiptV01(policyInput);
    insertVNextCoreRecordV01(db, {
      record_kind: "run_receipt",
      record_id: policyReceipt.receipt_id,
      workspace_id: policyReceipt.workspace_id,
      project_id: policyReceipt.project_id,
      fingerprint: policyReceipt.integrity.fingerprint,
      idempotency_key: policyReceipt.idempotency_key,
      payload: policyReceipt,
      created_at: policyReceipt.recorded_at,
    });
    const policyProject = projectFixture(
      emptyProject.project.project_id,
      workspace.workspace_id,
      "policy-history",
    );
    const policyPrefix = buildDurableLocalClosedLoopM3APrefixFixtureV01(
      policyProject,
    );
    const policyProposal = buildSemanticReviewLoopProposalFixture(
      policyProject,
      policyPrefix.prior_packet,
      policyReceipt,
    );
    insertPendingProposal(db, policyProposal);
    const policyHistoryHome = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: emptyProject.project.project_id,
    }, { now: () => fixedGeneratedAt });
    const policyProposalAttention = policyHistoryHome.attention.items.find(
      (item) => item.proposal_id === policyProposal.proposal_id,
    );
    assert(policyProposalAttention);
    assert.equal(
      policyProposalAttention.signals.includes("policy_triggered"),
      true,
    );
    assert.equal(policyProposalAttention.signals.includes("interactive"), false);
    assert.equal(
      policyProposalAttention.workbench_entry?.origin,
      "policy_triggered",
    );
    assert.equal(
      policyProposalAttention.workbench_entry?.entry_state,
      "pending_proposal",
    );
    assert.deepEqual(policyProposalAttention.workbench_entry?.source, {
      record_kind: "episode_delta_proposal",
      record_id: policyProposal.proposal_id,
    });

    const malformedPacket = { malformed: true, bounded_summary: "must not render" };
    insertVNextCoreRecordV01(db, {
      record_kind: "task_context_packet",
      record_id: "task-context-packet:project-home-malformed",
      workspace_id: workspace.workspace_id,
      project_id: emptyProject.project.project_id,
      fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(malformedPacket),
      ),
      idempotency_key: null,
      payload: malformedPacket,
      created_at: fixedGeneratedAt,
    });
    const malformedOptionalSection = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: emptyProject.project.project_id,
    }, { now: () => fixedGeneratedAt });
    assert.equal(malformedOptionalSection.working_projection.state.status, "error");
    assert.equal(malformedOptionalSection.coordination.state.status, "error");
    assert.equal(malformedOptionalSection.personal_perspective.task_basis, null);
    assert.equal(malformedOptionalSection.accepted_state.state.status, "empty");
    assert.equal(JSON.stringify(malformedOptionalSection).includes("must not render"), false);

    const confirmedA = await onboard(projectARoot, "2026-07-15T09:02:00.000Z");
    const confirmedTemporal = await onboard(
      temporalReviewRoot,
      "2026-07-15T09:02:30.000Z",
    );
    const confirmedContextReview = await onboard(
      contextReviewRoot,
      "2026-07-15T09:02:45.000Z",
    );
    insertTaskContextPacket(
      db,
      workspace.workspace_id,
      confirmedContextReview.project.project_id,
      {
        marker: "Stale selected context requiring review",
        perspective_ref: "perspective:project-home-stale-review",
        expires_at: null,
        generated_at: "2026-07-15T09:02:46.000Z",
        currentness: "stale",
      },
    );
    const staleContextBefore = databaseSnapshot(db);
    const staleContextHome = await readProjectHomeProjectionV01(
      db,
      {
        workspace_id: workspace.workspace_id,
        project_id: confirmedContextReview.project.project_id,
      },
      { now: () => "2026-07-15T09:02:46.500Z" },
    );
    const staleContextAttention = staleContextHome.attention.items.find(
      (item) => item.attention_id === "working-context:stale",
    );
    assert(staleContextAttention?.workbench_entry);
    assert.equal(
      staleContextAttention.workbench_entry.entry_state,
      "project_review",
    );
    assert.equal(staleContextAttention.workbench_entry.review_required, true);
    assert.deepEqual(staleContextAttention.workbench_entry.source, {
      record_kind: "project_review",
      record_id: null,
    });
    assert.equal(
      staleContextHome.coordination.primary_action?.review_required,
      true,
    );
    assert.deepEqual(
      databaseSnapshot(db),
      staleContextBefore,
      "stale context review reads create no rows",
    );

    insertTaskContextPacket(
      db,
      workspace.workspace_id,
      confirmedContextReview.project.project_id,
      {
        marker: "Partial selected context requiring review",
        perspective_ref: "perspective:project-home-partial-review",
        expires_at: null,
        generated_at: "2026-07-15T09:02:47.000Z",
        currentness: "partial",
      },
    );
    const partialContextBefore = databaseSnapshot(db);
    const partialContextHome = await readProjectHomeProjectionV01(
      db,
      {
        workspace_id: workspace.workspace_id,
        project_id: confirmedContextReview.project.project_id,
      },
      { now: () => "2026-07-15T09:02:47.500Z" },
    );
    const partialContextAttention = partialContextHome.attention.items.find(
      (item) => item.attention_id === "working-context:partial",
    );
    assert(partialContextAttention?.workbench_entry);
    assert.equal(
      partialContextAttention.workbench_entry.entry_state,
      "project_review",
    );
    assert.equal(partialContextAttention.workbench_entry.review_required, true);
    assert.deepEqual(partialContextAttention.workbench_entry.source, {
      record_kind: "project_review",
      record_id: null,
    });
    assert.equal(
      partialContextHome.coordination.primary_action?.review_required,
      true,
    );
    assert.deepEqual(
      databaseSnapshot(db),
      partialContextBefore,
      "partial context review reads create no rows",
    );

    const confirmedB = await onboard(projectBRoot, "2026-07-15T09:03:00.000Z");
    assert.notEqual(confirmedA.project.project_id, confirmedB.project.project_id);
    const refsA = listProjectExternalRefsV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedA.project.project_id,
    });
    const refsB = listProjectExternalRefsV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedB.project.project_id,
    });
    assert.equal(refsA[0]?.external_ref.external_id, sharedRemote);
    assert.equal(refsB[0]?.external_ref.external_id, sharedRemote);

    const projectA = projectFixture(
      confirmedA.project.project_id,
      workspace.workspace_id,
      "a",
    );
    const projectB = projectFixture(
      confirmedB.project.project_id,
      workspace.workspace_id,
      "b",
    );
    const temporalProject = projectFixture(
      confirmedTemporal.project.project_id,
      workspace.workspace_id,
      "temporal",
    );

    insertTaskContextPacket(
      db,
      workspace.workspace_id,
      confirmedA.project.project_id,
      {
        marker: expiringPerspectiveMarker,
        perspective_ref: "perspective:project-home-expiring",
        expires_at: TASK_CONTEXT_PACKET_FIXTURE_EXPIRES_AT,
      },
    );
    insertTaskContextPacket(
      db,
      workspace.workspace_id,
      confirmedB.project.project_id,
      {
        marker: noExpiryPerspectiveMarker,
        perspective_ref: "perspective:project-home-no-expiry",
        expires_at: null,
      },
    );
    const beforePacketTemporalReads = databaseSnapshot(db);
    let evaluationClockCalls = 0;
    const beforePacketExpiry = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedA.project.project_id,
    }, {
      now: () => {
        evaluationClockCalls += 1;
        return "2026-07-10T23:59:59.999Z";
      },
    });
    assert.equal(evaluationClockCalls, 1, "Project Home captures its clock once");
    assert.equal(beforePacketExpiry.generated_at, "2026-07-10T23:59:59.999Z");
    assert.equal(beforePacketExpiry.working_projection.state.status, "available");
    assert.equal(beforePacketExpiry.working_projection.summary, expiringPerspectiveMarker);
    assert.equal(
      beforePacketExpiry.working_projection.source_perspective_ref,
      "perspective:project-home-expiring",
    );
    const atPacketExpiry = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedA.project.project_id,
    }, { now: () => TASK_CONTEXT_PACKET_FIXTURE_EXPIRES_AT });
    assert.equal(atPacketExpiry.working_projection.state.status, "unavailable");
    assert.equal(atPacketExpiry.coordination.state.status, "action_required");
    assert.equal(atPacketExpiry.working_projection.summary, null);
    assert.equal(atPacketExpiry.working_projection.source_perspective_ref, null);
    assert.equal(JSON.stringify(atPacketExpiry).includes(expiringPerspectiveMarker), false);
    const afterPacketExpiry = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedA.project.project_id,
    }, { now: () => fixedGeneratedAt });
    assert.equal(afterPacketExpiry.working_projection.state.status, "unavailable");
    assert.equal(afterPacketExpiry.working_projection.state.message, "The latest selected working context has expired.");
    assert.equal(JSON.stringify(afterPacketExpiry).includes(expiringPerspectiveMarker), false);
    assert.equal(JSON.stringify(afterPacketExpiry).includes("perspective:project-home-expiring"), false);
    const noExpiryHome = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedB.project.project_id,
    }, { now: () => fixedGeneratedAt });
    assert.equal(noExpiryHome.working_projection.state.status, "available");
    assert.equal(noExpiryHome.working_projection.summary, noExpiryPerspectiveMarker);
    assert.equal(noExpiryHome.working_projection.source_perspective_ref, "perspective:project-home-no-expiry");
    await assert.rejects(
      readProjectHomeProjectionV01(db, {
        workspace_id: workspace.workspace_id,
        project_id: confirmedA.project.project_id,
      }, { now: () => "not-a-strict-timestamp" }),
      /project_home_evaluation_timestamp_invalid/,
    );
    assert.deepEqual(
      databaseSnapshot(db),
      beforePacketTemporalReads,
      "packet temporal reads create or update no rows",
    );
    const runReceipt = insertRunReceipt(db, projectA);
    const pendingA = rebuildProposal(projectA, "PROJECT A PENDING MARKER 0", "pending-a-0");
    insertPendingProposal(db, pendingA);
    const rejectedA = rebuildProposal(projectA, "PROJECT A REJECTED MARKER", "rejected-a");
    persistVNextSemanticReviewMaterialV01(db, {
      proposal: rejectedA,
      decision: buildDecision(projectA, rejectedA, "reject"),
    });
    const pendingB = rebuildProposal(projectB, projectBMarker, "pending-b");
    insertPendingProposal(db, pendingB);
    for (let index = 1; index <= 5; index += 1) {
      insertPendingProposal(
        db,
        rebuildProposal(
          projectA,
          `PROJECT A PENDING MARKER ${index}`,
          `pending-a-${index}`,
        ),
      );
    }
    const latestFailedReceipt = insertFailedRunReceipt(db, projectA);
    const revisitProposal = rebuildProposal(
      temporalProject,
      "TEMPORAL REVIEW REVISIT MARKER",
      "temporal-revisit",
    );
    persistVNextSemanticReviewMaterialV01(db, {
      proposal: revisitProposal,
      decision: buildDecision(temporalProject, revisitProposal, "defer", {
        decided_at: "2026-07-14T08:00:00.000Z",
        revisit: {
          revisit_at: "2026-07-16T08:00:00.000Z",
          expires_at: null,
          condition_summary: null,
        },
      }),
    });
    const expiryProposal = rebuildProposal(
      temporalProject,
      "TEMPORAL REVIEW EXPIRY MARKER",
      "temporal-expiry",
    );
    persistVNextSemanticReviewMaterialV01(db, {
      proposal: expiryProposal,
      decision: buildDecision(temporalProject, expiryProposal, "defer", {
        decided_at: "2026-07-14T08:01:00.000Z",
        revisit: {
          revisit_at: null,
          expires_at: "2026-07-17T08:00:00.000Z",
          condition_summary: null,
        },
      }),
    });
    const conditionProposal = rebuildProposal(
      temporalProject,
      "TEMPORAL REVIEW CONDITION MARKER",
      "temporal-condition",
    );
    persistVNextSemanticReviewMaterialV01(db, {
      proposal: conditionProposal,
      decision: buildDecision(temporalProject, conditionProposal, "defer", {
        decided_at: "2026-07-14T08:02:00.000Z",
        revisit: {
          revisit_at: null,
          expires_at: null,
          condition_summary: "Revisit only after a canonical condition result exists.",
        },
      }),
    });
    const newerTerminalProposal = rebuildProposal(
      temporalProject,
      "TEMPORAL NEWER TERMINAL MARKER",
      "temporal-newer-terminal",
    );
    persistVNextSemanticReviewMaterialV01(db, {
      proposal: newerTerminalProposal,
      decision: buildDecision(temporalProject, newerTerminalProposal, "defer", {
        decided_at: "2026-07-12T08:00:00.000Z",
        revisit: {
          revisit_at: "2026-07-15T08:00:00.000Z",
          expires_at: null,
          condition_summary: null,
        },
      }),
    });
    persistVNextSemanticReviewMaterialV01(db, {
      proposal: newerTerminalProposal,
      decision: buildDecision(temporalProject, newerTerminalProposal, "reject", {
        decided_at: "2026-07-13T08:00:00.000Z",
      }),
    });
    const newerDeferProposal = rebuildProposal(
      temporalProject,
      "TEMPORAL NEWER DEFER MARKER",
      "temporal-newer-defer",
    );
    persistVNextSemanticReviewMaterialV01(db, {
      proposal: newerDeferProposal,
      decision: buildDecision(temporalProject, newerDeferProposal, "reject", {
        decided_at: "2026-07-12T08:00:00.000Z",
      }),
    });
    persistVNextSemanticReviewMaterialV01(db, {
      proposal: newerDeferProposal,
      decision: buildDecision(temporalProject, newerDeferProposal, "defer", {
        decided_at: "2026-07-14T08:03:00.000Z",
        revisit: {
          revisit_at: "2026-07-20T08:00:00.000Z",
          expires_at: null,
          condition_summary: null,
        },
      }),
    });
    const legacySemanticProject = projectFixture(
      LEGACY_AUGNES_PROJECT_SCOPE_V01,
      workspace.workspace_id,
      "legacy-decision",
    );
    const legacyProposal = rebuildProposal(
      legacySemanticProject,
      "LEGACY PROJECT AUGNES DECISION MARKER",
      "legacy-decision",
    );
    persistVNextSemanticReviewMaterialV01(db, {
      proposal: legacyProposal,
      decision: buildDecision(legacySemanticProject, legacyProposal, "defer", {
        decided_at: "2026-07-14T08:04:00.000Z",
        revisit: {
          revisit_at: "2026-07-15T08:00:00.000Z",
          expires_at: null,
          condition_summary: null,
        },
      }),
    });
    insertLegacyWorkItem(db);

    const beforeTemporalAttentionReads = databaseSnapshot(db);
    const beforeRevisit = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedTemporal.project.project_id,
    }, { now: () => fixedGeneratedAt });
    assert.equal(beforeRevisit.attention.state.status, "available");
    assert.equal(beforeRevisit.attention.total_count, 0);
    assert(beforeRevisit.attention.state.message.includes("4 candidates remain deferred"));
    assert.equal(beforeRevisit.next_moves.some((move) => move.move_id === "open_workbench"), false);

    const atRevisit = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedTemporal.project.project_id,
    }, { now: () => "2026-07-16T08:00:00.000Z" });
    assert.equal(atRevisit.attention.total_count, 1);
    assert.equal(atRevisit.attention.items[0]?.proposal_id, revisitProposal.proposal_id);
    assert.equal(atRevisit.attention.items[0]?.reason, "A deferred review time has arrived.");
    assert.equal(atRevisit.coordination.primary_action, null);
    assert(atRevisit.next_moves.some((move) => move.move_id === "make_active"));
    assert.equal(
      atRevisit.attention.items[0]?.workbench_entry?.href,
      `/workbench/semantic-review/${revisitProposal.proposal_id.replace(":", "~")}?project_id=${encodeURIComponent(revisitProposal.project_id)}`,
    );

    const afterRevisit = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedTemporal.project.project_id,
    }, { now: () => "2026-07-16T08:00:00.001Z" });
    assert.equal(afterRevisit.attention.items.some((item) => item.proposal_id === revisitProposal.proposal_id), true);

    const atExpiry = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedTemporal.project.project_id,
    }, { now: () => "2026-07-17T08:00:00.000Z" });
    assert.equal(atExpiry.attention.total_count, 2);
    assert.equal(
      atExpiry.attention.items.find((item) => item.proposal_id === expiryProposal.proposal_id)?.reason,
      "A deferred review expiry has arrived.",
    );
    assert.equal(atExpiry.attention.items.some((item) => item.proposal_id === conditionProposal.proposal_id), false);
    assert.equal(atExpiry.attention.items.some((item) => item.proposal_id === newerTerminalProposal.proposal_id), false);
    assert.equal(atExpiry.attention.items.some((item) => item.proposal_id === newerDeferProposal.proposal_id), false);
    assert.equal(JSON.stringify(atExpiry).includes("LEGACY PROJECT AUGNES DECISION MARKER"), false);

    const atNewerDeferRevisit = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedTemporal.project.project_id,
    }, { now: () => "2026-07-20T08:00:00.000Z" });
    assert.equal(
      atNewerDeferRevisit.attention.items.some(
        (item) => item.proposal_id === newerDeferProposal.proposal_id,
      ),
      true,
    );
    assert.equal(
      atNewerDeferRevisit.attention.items.some(
        (item) => item.proposal_id === newerTerminalProposal.proposal_id,
      ),
      false,
    );
    assert.equal(
      atNewerDeferRevisit.attention.items.some(
        (item) => item.proposal_id === conditionProposal.proposal_id,
      ),
      false,
    );
    const repeatedTemporalRead = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedTemporal.project.project_id,
    }, { now: () => "2026-07-20T08:00:00.000Z" });
    assert.deepEqual(repeatedTemporalRead, atNewerDeferRevisit);
    assert.deepEqual(
      databaseSnapshot(db),
      beforeTemporalAttentionReads,
      "defer and effective-decision temporal reads create or update no rows",
    );

    const beforeAccepted = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedA.project.project_id,
    }, { now: () => fixedGeneratedAt });
    assert.equal(beforeAccepted.accepted_state.state.status, "empty");
    assert.equal(beforeAccepted.accepted_state.total_count, 0);
    assert.equal(beforeAccepted.working_projection.state.status, "unavailable");
    assert.equal(beforeAccepted.working_projection.summary, null);
    assert.equal(JSON.stringify(beforeAccepted).includes(expiringPerspectiveMarker), false);
    assert.equal(beforeAccepted.attention.total_count, 7);
    assert.equal(beforeAccepted.attention.items.length, 5, "pending attention is bounded");
    const currentActiveSelection =
      beforeAccepted.project_summary.active_selection;
    assert(currentActiveSelection);
    const currentProjectBoundedAttention = {
      ...beforeAccepted,
      project_summary: {
        ...beforeAccepted.project_summary,
        is_active: true,
        active_selection: {
          ...currentActiveSelection,
          project_id: beforeAccepted.project_id,
        },
      },
    };
    const boundedAttentionGuide = buildProjectGuideBriefV02({
      source: {
        route_mode: "canonical",
        requested_project_id: null,
        active_project_id: beforeAccepted.project_id,
        recent_projects: [],
        projection: currentProjectBoundedAttention,
        project_resolution: "resolved",
        direct_host_round_trip_available: false,
        delegated_work: null,
      },
      generated_at: fixedGeneratedAt,
    });
    const boundedAttentionBlankState =
      boundedAttentionGuide.projections.blank_state;
    assert.equal(boundedAttentionBlankState.known_attention_count, 5);
    assert.equal(
      boundedAttentionBlankState.attention_count_status,
      "lower_bound",
    );
    assert.equal(
      boundedAttentionBlankState.source_omitted_attention_count,
      2,
    );
    assert.match(
      boundedAttentionBlankState.continuity_summary,
      /at least 5 known items genuinely need you/u,
    );
    assert.equal(
      1 + boundedAttentionBlankState.continuity_items.length,
      5,
    );
    assert.equal(
      boundedAttentionBlankState.continuity_items.some(
        (item) =>
          item.item_id === boundedAttentionBlankState.highlighted_item.item_id,
      ),
      false,
    );
    assert.equal(
      (boundedAttentionBlankState.primary_action === null ? 0 : 1) <= 1,
      true,
    );
    assert.equal(beforeAccepted.attention.decision_debt.pending_candidate_count, 6);
    const blockedResultAttention = beforeAccepted.attention.items.find(
      (item) => item.attention_id === `result:${latestFailedReceipt.receipt_id}`,
    );
    assert(blockedResultAttention, "blocked result remains visible beside proposals");
    assert.equal(blockedResultAttention.signals.includes("blocked"), true);
    assert.equal(
      beforeAccepted.attention.items.every(
        (item, index, items) =>
          index === 0 || items[index - 1]!.priority <= item.priority,
      ),
      true,
      "attention ordering is deterministic and consequence-first",
    );
    assert.equal(beforeAccepted.attention.items.some((item) => item.summary.includes("REJECTED")), false);
    assert.equal(beforeAccepted.attention.items.some((item) => item.summary.includes(projectBMarker)), false);
    assert.equal(beforeAccepted.recent_activity.items.some((item) => item.activity_kind === "run_receipt"), true);
    assert.equal(beforeAccepted.recent_activity.items.some((item) => item.summary.includes(acceptedMarker)), false);
    assert.equal(beforeAccepted.recent_activity.items.some((item) => item.summary.includes(legacyMarker)), false);
    assert.equal(runReceipt.project_id, confirmedA.project.project_id);
    assert.equal(beforeAccepted.run_results.current_run, null);
    assert.equal(beforeAccepted.run_results.latest_result_state, "available");
    // Protected destinations keep the observed project even if another client
    // changes the workspace selection before the link is opened.
    for (const href of [beforeAccepted.coordination.inspector_href,
      beforeAccepted.automation.inspector_href,
      beforeAccepted.personal_perspective.task_basis?.inspector_href,
      beforeAccepted.run_results.latest_result?.inspector_href]) {
      if (!href) continue;
      const target = new URL(href, "http://127.0.0.1");
      assert.equal(target.pathname, "/workbench/inspector");
      assert.deepEqual(target.searchParams.getAll("project_id"), [confirmedA.project.project_id]);
      assert.ok(target.searchParams.get("target"));
    }
    assert.equal(
      beforeAccepted.run_results.latest_result?.receipt_ref,
      latestFailedReceipt.receipt_id,
    );
    assert.equal(
      beforeAccepted.run_results.latest_result?.review_href,
      `/workbench/results/${latestFailedReceipt.receipt_id.replace(":", "~")}?project_id=${encodeURIComponent(confirmedA.project.project_id)}`,
    );
    assert.equal(
      beforeAccepted.run_results.workbench_entry?.href,
      `/workbench/results/${latestFailedReceipt.receipt_id.replace(":", "~")}?project_id=${encodeURIComponent(confirmedA.project.project_id)}`,
    );
    assert.equal(
      beforeAccepted.run_results.workbench_entry?.server_scope_validation_required,
      true,
    );
    const readOnlyResult = readProjectRunResultDetailV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedA.project.project_id,
      receipt_id: runReceipt.receipt_id,
    });
    assert.equal(readOnlyResult.summary.receipt_ref, runReceipt.receipt_id);
    assert.equal(readOnlyResult.authority.proposal_created, false);
    assert.equal(readOnlyResult.authority.review_decision_created, false);
    assert.equal(readOnlyResult.authority.semantic_transition_created, false);
    assert.equal(readOnlyResult.authority.evidence_accepted, false);
    assert.equal(readOnlyResult.authority.work_closed, false);
    assert.equal(Object.hasOwn(runReceipt, "host_approvals"), false);
    assert.equal(readOnlyResult.host.approvals.length, 0);
    assert.equal(readOnlyResult.model_invocations.length, 1);
    assert.equal(
      readOnlyResult.model_invocations[0]?.state,
      "resolved_augnes_owned",
    );
    assert.equal(readOnlyResult.model_invocations[0]?.status, "completed");
    assert.equal(readOnlyResult.model_invocations[0]?.purpose, "planner_plan");
    assert.equal(
      readOnlyResult.model_invocations[0]?.outcome,
      "deterministic_success",
    );
    assert.equal(
      readOnlyResult.model_invocations[0]?.cost_summary,
      "Cost unavailable; no pricing authority was recorded.",
    );
    assert.match(
      readOnlyResult.model_invocations[0]?.budget_summary ?? "",
      /0\/0 provider calls.*30000 ms timeout/u,
    );
    assert.equal(
      readOnlyResult.model_invocations[0]?.cancellation_disposition,
      "not_cancelled",
    );
    assert.equal(readOnlyResult.model_invocations[0]?.coverage, "enforced");
    assert.throws(
      () =>
        readProjectRunResultDetailV01(db!, {
          workspace_id: workspace.workspace_id,
          project_id: confirmedB.project.project_id,
          receipt_id: runReceipt.receipt_id,
        }),
      (error) =>
        error instanceof ProjectRunResultReadErrorV01 &&
        error.code === "project_result_receipt_missing",
      "a server-issued result link must fail after the active project scope changes",
    );

    const transitionDebtProposal = rebuildProposal(
      projectA,
      "PROJECT A ACCEPTED DECISION AWAITING TRANSITION",
      "accepted-awaiting-transition-a",
    );
    persistVNextSemanticReviewMaterialV01(db, {
      proposal: transitionDebtProposal,
      decision: buildDecision(projectA, transitionDebtProposal, "accept"),
    });
    const withTransitionDebt = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedA.project.project_id,
    }, { now: () => fixedGeneratedAt });
    const transitionDebtItem = withTransitionDebt.attention.items.find(
      (item) => item.proposal_id === transitionDebtProposal.proposal_id,
    );
    assert(transitionDebtItem);
    assert.equal(transitionDebtItem.priority, 20);
    assert.equal(transitionDebtItem.workbench_entry?.entry_state, "decided_proposal");
    assert.equal(transitionDebtItem.signals.includes("decision_debt"), true);
    assert.equal(
      withTransitionDebt.attention.decision_debt.accepted_awaiting_transition_count,
      1,
    );
    assert.equal(withTransitionDebt.accepted_state.total_count, 0);

    const acceptedProposal = rebuildProposal(projectA, acceptedMarker, "accepted-a");
    const accepted = persistAcceptedTransition(db, projectA, acceptedProposal);
    assert(accepted.committed.transition_receipt);
    const afterAccepted = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedA.project.project_id,
    }, { now: () => fixedGeneratedAt });
    assert.equal(afterAccepted.accepted_state.state.status, "available");
    assert.equal(afterAccepted.accepted_state.total_count, 1);
    assert.equal(afterAccepted.accepted_state.items[0]?.summary, acceptedMarker);
    assert.deepEqual(
      afterAccepted.accepted_state.items[0]?.lineage.map((item) => item.role),
      ["source_proposal", "decision", "durable_transition", "accepted_state"],
    );
    const blockedTransitionDebt = afterAccepted.attention.items.find(
      (item) => item.proposal_id === transitionDebtProposal.proposal_id,
    );
    assert(blockedTransitionDebt);
    assert.equal(
      blockedTransitionDebt.workbench_entry?.entry_state,
      "transition_blocked",
    );
    assert.equal(blockedTransitionDebt.priority, 15);
    assert.equal(blockedTransitionDebt.signals.includes("blocked"), true);
    assert.equal(afterAccepted.working_projection.state.status, "unavailable");
    assert.equal(afterAccepted.working_projection.summary, null);
    assert.equal(afterAccepted.working_projection.projection_kind, null);
    assert.equal(afterAccepted.working_projection.source_perspective_ref, null);
    assert.equal(afterAccepted.working_projection.source_revision, null);
    assert.equal(afterAccepted.project_summary.repository?.display, sharedRemote);
    assert.equal(
      afterAccepted.capabilities.items.find((item) => item.capability === "github")?.status,
      "unavailable",
    );
    assert.equal(afterAccepted.attention.items.some((item) => item.proposal_id === acceptedProposal.proposal_id), false);
    assert(afterAccepted.recent_activity.items.some((item) => item.activity_kind === "accepted_transition"));
    assert(afterAccepted.recent_activity.items.some((item) => item.activity_kind === "review_decision"));
    assert(afterAccepted.recent_activity.items.length <= 5);

    const projectBHome = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedB.project.project_id,
    }, { now: () => fixedGeneratedAt });
    assert.equal(projectBHome.accepted_state.state.status, "empty");
    assert.equal(projectBHome.working_projection.state.status, "available");
    assert.equal(projectBHome.working_projection.summary, noExpiryPerspectiveMarker);
    assert.equal(projectBHome.attention.total_count, 1);
    assert.equal(projectBHome.attention.items[0]?.summary, projectBMarker);
    assert.equal(JSON.stringify(projectBHome).includes(acceptedMarker), false);
    assert.equal(JSON.stringify(projectBHome).includes(expiringPerspectiveMarker), false);
    assert.equal(JSON.stringify(afterAccepted).includes(noExpiryPerspectiveMarker), false);
    assert.equal(JSON.stringify(afterAccepted).includes(projectBMarker), false);
    assert.equal(JSON.stringify(afterAccepted).includes(legacyMarker), false);

    const legacyIdentity = resolveLegacyProjectCompatibilityIdentityV01(db, {
      legacy_scope: LEGACY_AUGNES_PROJECT_SCOPE_V01,
    });
    const legacyRead = readLegacyProjectWorkItemsCompatibilityV01(db, {
      legacy_scope: LEGACY_AUGNES_PROJECT_SCOPE_V01,
    });
    assert.equal(legacyIdentity?.identity_kind, "legacy_compatibility");
    assert.equal(legacyRead?.work_items[0]?.title, legacyMarker);
    assert.equal(
      (db.prepare("SELECT COUNT(*) AS count FROM vnext_project_identities WHERE project_id = 'project:augnes'").get() as { count: number }).count,
      0,
    );

    for (const status of [
      "available",
      "action_required",
      "misconfigured",
      "unavailable",
    ] satisfies ProjectHomeCapabilityStatusValueV01[]) {
      const capabilities = await readProjectHomeCapabilityStatusesV01(() => [
        {
          capability: "openai",
          status,
          summary: `OPENAI_API_KEY=${secretMarker}`,
          verification: status === "available" ? "trusted_local_status" : "not_remotely_verified",
        },
        {
          capability: "codex_native_host",
          status,
          summary: "Deterministic local test status.",
          verification: "not_remotely_verified",
        },
        {
          capability: "github",
          status,
          summary: "Repository metadata does not prove provider availability.",
          verification: "not_remotely_verified",
        },
        {
          capability: "mcp",
          status,
          summary: "Deterministic local test status.",
          verification: "not_remotely_verified",
        },
        {
          capability: "scheduler",
          status,
          summary: "Deterministic local test status.",
          verification: "not_remotely_verified",
        },
      ]);
      assert(capabilities.items.every((item) => item.status === status));
      assert.equal(JSON.stringify(capabilities).includes(secretMarker), false);
    }

    for (const testCase of [
      { apiKey: null, model: null, expectedStatus: "unavailable" },
      { apiKey: secretMarker, model: null, expectedStatus: "available" },
      {
        apiKey: null,
        model: privateModelMarker,
        expectedStatus: "action_required",
      },
      {
        apiKey: secretMarker,
        model: privateModelMarker,
        expectedStatus: "available",
      },
      {
        apiKey: secretMarker,
        model: malformedModelMarker,
        expectedStatus: "misconfigured",
      },
      { apiKey: "   ", model: "   ", expectedStatus: "unavailable" },
    ] as const) {
      if (testCase.apiKey === null) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = testCase.apiKey;
      if (testCase.model === null) delete process.env.OPENAI_MODEL;
      else process.env.OPENAI_MODEL = testCase.model;

      const capabilities = await readProjectHomeCapabilityStatusesV01();
      const openAiCapability = capabilities.items.find(
        (item) => item.capability === "openai",
      );
      assert.equal(openAiCapability?.status, testCase.expectedStatus);
      assert.equal(openAiCapability?.verification, "trusted_local_status");
      assert.match(
        openAiCapability?.summary ?? "",
        /not contacted or verified|deterministic model behavior remains available/i,
      );
      assert(
        capabilities.items
          .filter((item) => item.capability !== "openai")
          .every((item) => item.status === "unavailable"),
      );
      const serialized = JSON.stringify(capabilities);
      assert.equal(serialized.includes(secretMarker), false);
      assert.equal(serialized.includes(privateModelMarker), false);
      assert.equal(serialized.includes(malformedModelMarker), false);
    }
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;

    const activeBeforeDeepLink = clone(
      readActiveProjectSelectionV01(db, workspace.workspace_id),
    );
    const inactiveReadBefore = databaseSnapshot(db);
    const nonActiveA = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedA.project.project_id,
    }, { now: () => fixedGeneratedAt });
    assert.equal(nonActiveA.project_summary.is_active, false);
    assert.equal(nonActiveA.coordination.primary_action, null);
    assert(nonActiveA.next_moves.some((move) => move.move_id === "make_active"));
    assert.deepEqual(
      readActiveProjectSelectionV01(db, workspace.workspace_id),
      activeBeforeDeepLink,
    );
    assert.deepEqual(
      databaseSnapshot(db),
      inactiveReadBefore,
      "inactive Project Home reads create no rows or switch projects",
    );
    assert.equal(
      readProjectHomeEntryDestinationV01(db),
      `/projects/${encodeURIComponent(confirmedB.project.project_id)}`,
    );
    await assert.rejects(
      readProjectHomeProjectionV01(db, {
        workspace_id: "workspace:wrong-scope",
        project_id: confirmedA.project.project_id,
      }),
      /workspace_identity_invalid|project_not_found/,
    );
    await assert.rejects(
      readProjectHomeProjectionV01(db, {
        workspace_id: workspace.workspace_id,
        project_id: "project:augnes",
      }),
      /project_identity_invalid|project_not_found/,
    );

    const beforePassiveReads = databaseSnapshot(db);
    assert.equal(
      readProjectHomeEntryDestinationV01(db),
      `/projects/${encodeURIComponent(confirmedB.project.project_id)}`,
    );
    await readProjectHomeCapabilityStatusesV01();
    const firstDeterministic = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedA.project.project_id,
    }, { now: () => fixedGeneratedAt });
    const secondDeterministic = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedA.project.project_id,
    }, { now: () => fixedGeneratedAt });
    assert.deepEqual(firstDeterministic, secondDeterministic);
    const serializedProjection = JSON.stringify(firstDeterministic);
    assert(serializedProjection.includes(acceptedMarker));
    assert.equal(serializedProjection.includes(expiringPerspectiveMarker), false);
    assert.equal(serializedProjection.includes(noExpiryPerspectiveMarker), false);
    assert.equal(serializedProjection.includes(projectBMarker), false);
    assert.equal(serializedProjection.includes(legacyMarker), false);
    assert.equal(serializedProjection.includes(secretMarker), false);
    assert.deepEqual(databaseSnapshot(db), beforePassiveReads, "projection, server rendering, refresh-equivalent reads, and capabilities are read-only");

    const oldRootContents = readdirSync(projectARoot).sort();
    const oldGitConfig = readFileSync(path.join(projectARoot, ".git", "config"), "utf8");
    const recoveryContents = readdirSync(recoveredProjectARoot).sort();
    renameSync(projectARoot, `${projectARoot}.missing`);
    const missingHome = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedA.project.project_id,
    }, { now: () => fixedGeneratedAt });
    assert.equal(missingHome.project_summary.root_availability, "missing");
    assert.equal(missingHome.accepted_state.items[0]?.summary, acceptedMarker);
    assert.equal(missingHome.next_moves[0]?.move_id, "recover_root");
    const recoveryExpected = (await listRecentProjectsV01(db)).find(
      (entry) => entry.project.project_id === confirmedA.project.project_id,
    )!;
    const activeRecoveryExpected = readActiveProjectSelectionV01(
      db,
      workspace.workspace_id,
    );
    const recoverySelection = await inspectRecoverySelection(
      recoveredProjectARoot,
      "2026-07-15T09:04:00.000Z",
      {
        project_id: confirmedA.project.project_id,
        expected_old_root_binding_fingerprint:
          recoveryExpected.root_binding_fingerprint,
        expected_old_baseline_fingerprint:
          recoveryExpected.physical_root_baseline_fingerprint,
        expected_active_project_id:
          activeRecoveryExpected?.project_id ?? null,
        expected_active_selection_revision:
          activeRecoveryExpected?.selection_revision ?? null,
      },
    );
    assert.equal(recoverySelection.status, "selected");
    assert.equal(recoverySelection.recovery_action, "rebind");
    const rebound = await rebindWithBrowserDecisionV01(
      db,
      {
        project_id: confirmedA.project.project_id,
        selection_token: recoverySelection.selection_token,
        inspection_fingerprint: recoverySelection.inspection.inspection_fingerprint,
        expected_old_root_binding_fingerprint: recoveryExpected.root_binding_fingerprint,
        expected_old_baseline_fingerprint: recoveryExpected.physical_root_baseline_fingerprint,
      },
      { now: () => "2026-07-15T09:04:00.000Z" },
    );
    assert.equal(rebound.project.project_id, confirmedA.project.project_id);
    const recoveredHome = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedA.project.project_id,
    }, { now: () => fixedGeneratedAt });
    assert.equal(recoveredHome.project_summary.root_availability, "available");
    assert.equal(recoveredHome.accepted_state.items[0]?.summary, acceptedMarker);
    assert.equal(recoveredHome.project_summary.repository?.display, sharedRemote);
    assert.deepEqual(readdirSync(`${projectARoot}.missing`).sort(), oldRootContents);
    assert.equal(readFileSync(path.join(`${projectARoot}.missing`, ".git", "config"), "utf8"), oldGitConfig);
    assert.deepEqual(readdirSync(recoveredProjectARoot).sort(), recoveryContents);

    db.close();
    db = openDatabase();
    const reopenedWorkspace = readDefaultWorkspaceIdentityV01(db);
    assert.equal(reopenedWorkspace?.workspace_id, workspace.workspace_id);
    const reopenedHome = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedA.project.project_id,
    }, { now: () => fixedGeneratedAt });
    assert.equal(reopenedHome.project_summary.project.project_id, confirmedA.project.project_id);
    assert.equal(reopenedHome.project_summary.root_binding.local_root.normalized_path, recoveredProjectARoot);
    assert.equal(reopenedHome.accepted_state.items[0]?.summary, acceptedMarker);
    const reopenedResult = readProjectRunResultDetailV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedA.project.project_id,
      receipt_id: runReceipt.receipt_id,
    });
    assert.equal(reopenedResult.summary.receipt_ref, runReceipt.receipt_id);
    assert.equal(reopenedResult.authority.semantic_state_changed, false);
    assert.equal(readProjectHomeEntryDestinationV01(db), confirmedA.destination);

    const finalReadOnlySnapshot = databaseSnapshot(db);
    await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedA.project.project_id,
    }, { now: () => fixedGeneratedAt });
    assert.deepEqual(databaseSnapshot(db), finalReadOnlySnapshot);
    assert.equal(fetchCalls + socketCalls, 0);
    assert.equal(pickerProcessCalls, 0);

    console.log(JSON.stringify({
      status: "pass",
      empty_project_home: true,
      accepted_state_requires_durable_transition: true,
      proposal_not_promoted_to_accepted_state: true,
      task_context_packet_not_project_truth: true,
      selected_working_context_distinguished: true,
      project_home_clock_calls_per_read: 1,
      expired_packet_withheld: true,
      exact_packet_expiry_withheld: true,
      unexpired_packet_available: true,
      no_expiry_packet_available: true,
      defer_before_revisit_attention_count: 0,
      defer_at_revisit_attention_count: 1,
      defer_at_expiry_attention_count: 2,
      condition_only_defer_remains_deferred: true,
      multiple_decisions_resolved_deterministically: true,
      pending_attention_filtered_and_bounded: true,
      meaningful_activity_filtered_and_bounded: true,
      immutable_run_result_read_model: true,
      project_home_latest_result_link: true,
      cross_project_result_link_refused: true,
      result_reload_from_durable_state: true,
      retained_manual_compatibility_receipt_rendered: true,
      resolved_augnes_owned_r4_receipt_rendered: true,
      cross_project_r4_receipt_refused: true,
      automation_not_configured: true,
      personal_perspective_not_configured_and_excluded: true,
      capability_matrix_local_only: true,
      default_openai_capability_reader: "local_configuration_only",
      openai_capability_remote_checks: 0,
      capability_secret_values_exposed: 0,
      next_moves_deterministic_and_bounded: true,
      two_project_same_repository_isolation: true,
      wrong_workspace_rejected: true,
      legacy_markers_in_canonical_home: 0,
      read_only_row_changes: 0,
      root_recovery_preserved_identity_and_semantics: true,
      restart_and_deep_link_continuity: true,
      network_calls: fetchCalls + socketCalls,
      model_calls: 0,
      git_processes: pickerProcessCalls,
      mcp_processes: 0,
      codex_host_processes: 0,
      scheduler_processes: 0,
    }, null, 2));
  } finally {
    if (db?.open) db.close();
    globalThis.fetch = originalFetch;
    Socket.prototype.connect = originalSocketConnect;
    process.env = originalEnvironment;
    rmSync(root, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "project_home_test_failed");
  process.exitCode = 1;
});
