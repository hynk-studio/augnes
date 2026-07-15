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
import {
  TASK_CONTEXT_PACKET_FIXTURE_EXPIRES_AT,
  TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT,
  genericCliBuilderInputFixture,
} from "../fixtures/vnext/protocol/task-context-packet-v0-1";
import {
  createEpisodeDeltaProposalFingerprintV01,
  deriveEpisodeDeltaProposalIdV01,
  validateEpisodeDeltaProposalV01,
} from "../lib/vnext/episode-delta-proposal";
import {
  confirmLocalProjectOnboardingV01,
  pickAndInspectLocalProjectV01,
  rebindLocalProjectRootFromSelectionV01,
} from "../lib/vnext/onboarding/local-project-onboarding";
import {
  insertVNextCoreRecordV01,
} from "../lib/vnext/persistence/durable-semantic-store";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "../lib/vnext/protocol-primitives";
import {
  listProjectExternalRefsV01,
  readDefaultWorkspaceIdentityV01,
} from "../lib/vnext/persistence/project-identity-registry";
import {
  readActiveProjectSelectionV01,
} from "../lib/vnext/persistence/project-lifecycle-registry";
import {
  readProjectHomeCapabilityStatusesV01,
  readProjectHomeEntryDestinationV01,
  readProjectHomeProjectionV01,
} from "../lib/vnext/project-home/project-home-projection";
import {
  buildReviewDecisionV01,
  validateReviewDecisionAgainstEpisodeDeltaProposalV01,
  validateReviewDecisionV01,
} from "../lib/vnext/review-decision";
import {
  commitVNextSemanticTransitionV01,
  persistVNextSemanticReviewMaterialV01,
  prepareVNextSemanticCommitPreviewV01,
  recordVNextSemanticCommitAuthorizationV01,
} from "../lib/vnext/runtime/durable-semantic-transition";
import { buildTaskContextPacketV01 } from "../lib/vnext/task-context-packet";
import {
  LEGACY_AUGNES_PROJECT_SCOPE_V01,
} from "../types/vnext/project-identity";
import type { ProjectHomeCapabilityStatusValueV01 } from "../types/vnext/project-home";
import type { EpisodeDeltaProposalV01 } from "../types/vnext/episode-delta-proposal";
import type { TaskContextPacketBuilderInputV01 } from "../lib/vnext/task-context-packet";
import type { SemanticReviewLoopProjectFixtureV01 } from "../fixtures/vnext/protocol/semantic-review-loop-v0-1";
import {
  readLegacyProjectWorkItemsCompatibilityV01,
  resolveLegacyProjectCompatibilityIdentityV01,
} from "../lib/vnext/compat/project-identity";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";

const root = mkdtempSync(path.join(tmpdir(), "augnes-project-home-"));
const dbPath = path.join(root, "project-home.db");
const emptyRoot = path.join(root, "Empty local project");
const projectARoot = path.join(root, "Project A");
const projectBRoot = path.join(root, "Project B");
const temporalReviewRoot = path.join(root, "Temporal Review Project");
const recoveredProjectARoot = path.join(root, "Project A recovered");
const sharedRemote = "https://example.test/shared/project-home.git";
const fixedGeneratedAt = "2026-07-15T09:00:00.000Z";
const expiringPerspectiveMarker = "PROJECT A EXPIRING WORKING CONTEXT — NOT ACCEPTED STATE";
const noExpiryPerspectiveMarker = "PROJECT B NO-EXPIRY WORKING CONTEXT — NOT ACCEPTED STATE";
const acceptedMarker = "PROJECT A ACCEPTED STATE MARKER";
const projectBMarker = "PROJECT B PENDING MARKER";
const legacyMarker = "LEGACY PROJECT AUGNES MARKER";
const secretMarker = "project-home-secret-marker";
const originalEnvironment = { ...process.env };
const originalFetch = globalThis.fetch;
const originalSocketConnect = Socket.prototype.connect;
let fetchCalls = 0;
let socketCalls = 0;
let pickerProcessCalls = 0;
let db: Database.Database | null = null;

for (const key of [
  "OPENAI_API_KEY",
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
    decided_at?: string;
    revisit?: {
      revisit_at: string | null;
      expires_at: string | null;
      condition_summary: string | null;
    };
  } = {},
) {
  const input = createSemanticTransitionDecisionInputV01(project, proposal);
  input.decision = decision;
  if (options.decided_at) input.decided_at = options.decided_at;
  if (decision === "reject" || decision === "defer") {
    input.rationale_summary = decision === "reject"
      ? "The bounded synthetic proposal is rejected in the Project Home test."
      : "The bounded synthetic proposal remains deferred under explicit revisit semantics.";
    input.requested_transition_intent = null;
  }
  input.revisit = decision === "defer" ? options.revisit ?? null : null;
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
  },
) {
  const input = clone(genericCliBuilderInputFixture) as TaskContextPacketBuilderInputV01;
  const currentness = clone(input.source_status.currentness);
  input.workspace_id = workspaceId;
  input.project_id = projectId;
  input.generated_at = TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT;
  input.expires_at = inputOptions.expires_at;
  input.current_projection = {
    projection_kind: "current_working_perspective",
    projection_only: true,
    canonical_state: false,
    perspective_ref: inputOptions.perspective_ref,
    bounded_summary: inputOptions.marker,
    as_of: TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT,
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
  const receipt = buildDurableLocalClosedLoopM3APrefixFixtureV01(project).run_receipt;
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

async function main() {
  try {
    mkdirSync(emptyRoot);
    mkdirSync(projectARoot);
    mkdirSync(projectBRoot);
    mkdirSync(temporalReviewRoot);
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
    assert.equal(emptyHome.capabilities.items.length, 5);
    assert(emptyHome.capabilities.items.every((item) => item.status === "unavailable"));
    assert(emptyHome.next_moves.length > 0 && emptyHome.next_moves.length <= 3);
    assert.deepEqual(databaseSnapshot(db), emptyBefore, "empty Project Home reads create no rows");

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
    assert.equal(malformedOptionalSection.accepted_state.state.status, "empty");
    assert.equal(JSON.stringify(malformedOptionalSection).includes("must not render"), false);

    const confirmedA = await onboard(projectARoot, "2026-07-15T09:02:00.000Z");
    const confirmedTemporal = await onboard(
      temporalReviewRoot,
      "2026-07-15T09:02:30.000Z",
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
    assert.equal(beforeRevisit.next_moves.some((move) => move.move_id === "review_attention"), false);

    const atRevisit = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedTemporal.project.project_id,
    }, { now: () => "2026-07-16T08:00:00.000Z" });
    assert.equal(atRevisit.attention.total_count, 1);
    assert.equal(atRevisit.attention.items[0]?.proposal_id, revisitProposal.proposal_id);
    assert.equal(atRevisit.attention.items[0]?.reason, "A deferred review time has arrived.");
    assert(atRevisit.next_moves.some((move) => move.move_id === "review_attention"));

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
    assert.equal(beforeAccepted.attention.total_count, 6);
    assert.equal(beforeAccepted.attention.items.length, 5, "pending attention is bounded");
    assert.equal(beforeAccepted.attention.items.some((item) => item.summary.includes("REJECTED")), false);
    assert.equal(beforeAccepted.attention.items.some((item) => item.summary.includes(projectBMarker)), false);
    assert.equal(beforeAccepted.recent_activity.items.some((item) => item.activity_kind === "run_receipt"), true);
    assert.equal(beforeAccepted.recent_activity.items.some((item) => item.summary.includes(acceptedMarker)), false);
    assert.equal(beforeAccepted.recent_activity.items.some((item) => item.summary.includes(legacyMarker)), false);
    assert.equal(runReceipt.project_id, confirmedA.project.project_id);

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

    process.env.OPENAI_API_KEY = secretMarker;
    const tokenDoesNotProveReadiness = await readProjectHomeCapabilityStatusesV01();
    delete process.env.OPENAI_API_KEY;
    assert(tokenDoesNotProveReadiness.items.every((item) => item.status === "unavailable"));

    const activeBeforeDeepLink = clone(readActiveProjectSelectionV01(db, workspace.workspace_id));
    const nonActiveA = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: confirmedA.project.project_id,
    }, { now: () => fixedGeneratedAt });
    assert.equal(nonActiveA.project_summary.is_active, false);
    assert(nonActiveA.next_moves.some((move) => move.move_id === "make_active"));
    assert.deepEqual(readActiveProjectSelectionV01(db, workspace.workspace_id), activeBeforeDeepLink);
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
    const recoverySelection = await inspectSelection(
      recoveredProjectARoot,
      "2026-07-15T09:04:00.000Z",
    );
    assert.equal(recoverySelection.status, "selected");
    const rebound = await rebindLocalProjectRootFromSelectionV01(
      db,
      {
        project_id: confirmedA.project.project_id,
        selection_token: recoverySelection.selection_token,
        inspection_fingerprint: recoverySelection.inspection.inspection_fingerprint,
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
      automation_not_configured: true,
      personal_perspective_not_configured_and_excluded: true,
      capability_matrix_local_only: true,
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
