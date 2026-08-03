#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import { GET as continuityGET } from "../app/api/augnes/read/codex-current-continuity/route";
import {
  buildCurrentContinuityUrl,
  exitCodeForError,
  exitCodeForProjection,
  fetchCurrentContinuity,
  formatHumanSummary,
  formatMachineResult,
  resolveConfig,
} from "../apps/augnes_apps/scripts/codex-current-continuity";
import {
  buildSemanticReviewLoopProposalFixture,
  buildSemanticReviewLoopTaskContextPacketFixture,
  buildSemanticReviewLoopRunReceiptFixture,
  type SemanticReviewLoopProjectFixtureV01,
} from "../fixtures/vnext/protocol/semantic-review-loop-v0-1";
import {
  buildSemanticTransitionLoopFixtureV01,
  createSemanticTransitionDecisionInputV01,
} from "../fixtures/vnext/protocol/semantic-transition-loop-v0-1";
import {
  DURABLE_LOCAL_LOOP_APPLIED_AT,
  DURABLE_LOCAL_LOOP_CONFIRMED_AT,
  DURABLE_LOCAL_LOOP_CURRENT_STATE_OBSERVED_AT,
  DURABLE_LOCAL_LOOP_ELIGIBILITY_EVALUATED_AT,
  DURABLE_LOCAL_LOOP_GATE_EVALUATED_AT,
  DURABLE_LOCAL_LOOP_GATE_EXPIRES_AT,
  DURABLE_LOCAL_LOOP_PREVIEWED_AT,
  DURABLE_LOCAL_LOOP_RECORDED_AT,
} from "../fixtures/vnext/runtime/durable-local-closed-loop-v0-1";
import {
  assertCodexCurrentContinuityV01,
  chooseCodexCurrentContinuityNextActionV01,
  classifyCodexCurrentContinuityExecutionStageV01,
  classifyCodexCurrentContinuityResultCurrentnessV01,
  classifyCodexCurrentContinuityReviewV01,
  createCodexCurrentContinuitySnapshotBindingV01,
  loadCodexCurrentContinuityV01,
  readCodexCurrentContinuityV01,
} from "../lib/vnext/codex-current-continuity/codex-current-continuity";
import {
  CODEX_CURRENT_CONTINUITY_ACCESS_POLICY_V01,
  validateCodexCurrentContinuityReadRequestV01,
} from "../lib/vnext/codex-current-continuity/codex-current-continuity-route";
import {
  getOrCreateCanonicalProjectForLocalRootV01,
  getOrCreateDefaultWorkspaceIdentityV01,
  normalizeLocalProjectRootRefV01,
} from "../lib/vnext/persistence/project-identity-registry";
import {
  readActiveProjectSelectionV01,
  selectActiveProjectV01,
} from "../lib/vnext/persistence/project-lifecycle-registry";
import { insertVNextCoreRecordV01 } from "../lib/vnext/persistence/durable-semantic-store";
import {
  buildReviewDecisionV01,
  createEpisodeDeltaCandidateFingerprintV01,
} from "../lib/vnext/review-decision";
import {
  consumeVNextLocalOperatorBootstrapV01,
  issueVNextLocalOperatorBootstrapV01,
  readVNextLocalOperatorCredentialFromRequestV01,
  VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSessionCredentialV01,
} from "../lib/vnext/runtime/local-operator-session";
import {
  defineInitialProjectWorkV01,
} from "../lib/vnext/runtime/project-work-initialization";
import {
  buildInitialProjectWorkTaskContextPacketV01,
  inspectInitialProjectWorkPacketLineageV01,
} from "../lib/vnext/runtime/initial-project-work-context";
import { revisePreExecutionProjectWorkV01 } from "../lib/vnext/runtime/project-work-revision";
import { buildPreExecutionProjectWorkRevisionPacketV01 } from "../lib/vnext/runtime/pre-execution-project-work-revision";
import {
  VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
} from "../lib/vnext/runtime/persisted-semantic-context-compiler";
import {
  commitVNextSemanticTransitionV01,
  prepareVNextSemanticCommitPreviewV01,
  recordVNextSemanticCommitAuthorizationV01,
} from "../lib/vnext/runtime/durable-semantic-transition";
import {
  inspectVNextOperatorPilotPacketLineageV01,
  projectVNextOperatorPilotContinuityV01,
} from "../lib/vnext/runtime/operator-pilot-project-continuity";
import {
  readVNextOperatorPilotSemanticReviewV01,
  recordVNextOperatorPilotReviewDecisionV01,
} from "../lib/vnext/runtime/operator-pilot-review-material";
import {
  applyVNextOperatorPilotReviewedSemanticTransitionV01,
  confirmVNextOperatorPilotSemanticCommitV01,
  prepareVNextOperatorPilotSemanticCommitPreviewV01,
} from "../lib/vnext/runtime/operator-pilot-semantic-transition";
import {
  readProjectRunResultDetailV01,
  readProjectRunResultOverviewV01,
} from "../lib/vnext/runtime/project-run-result-read-model";
import {
  LiveNativeHostRunServiceV01,
  type LiveNativeHostRunProjectionV01,
} from "../lib/vnext/runtime/live-native-host-run-service";
import type { TaskContextPacketV01 } from "../types/vnext/task-context-packet";
import { buildTaskContextPacketV01 } from "../lib/vnext/task-context-packet";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";

const NOW = "2026-08-03T00:00:00.000Z";
const LATER = "2026-08-03T00:00:01.000Z";
const ROOT = mkdtempSync(path.join(tmpdir(), "augnes-cdx2a-"));
const ORIGINAL_ENV = { ...process.env };

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main(): Promise<void> {
  try {
    await assertExactOwnerStatesV01();
    await assertManagedRunPacketBindingsV01();
    await assertCurrentWorkResolutionStatesV01();
    await assertSemanticContinuityOwnerPathsV01();
    assertPureClassificationMatrixV01();
    assertSnapshotMaterialMatrixV01();
    await assertRouteAndCliAdaptersV01();
    console.log(JSON.stringify({
      status: "pass",
      contract: "codex_current_continuity.v0.1",
      canonical_owner: true,
      route_and_cli_thin_adapters: true,
      runtime_fallback: false,
      snapshot_binding_deterministic: true,
      result_packet_binding_exact: true,
      review_relations_exact: true,
      zero_database_writes: true,
      zero_project_file_writes: true,
      zero_start_or_authority_effects: true,
      mcp_added: false,
    }, null, 2));
  } finally {
    process.env = ORIGINAL_ENV;
    rmSync(ROOT, { recursive: true, force: true });
  }
}

async function assertManagedRunPacketBindingsV01(): Promise<void> {
  const fixture = createFixtureV01(
    "run-packet-bindings",
    "30000000-0000-4000-8000-000000000011",
  );
  try {
    const initial = defineInitialProjectWorkV01(fixture.db, {
      config: fixture.config,
      credential: authenticatedSessionV01(fixture, "run-binding-initial"),
      request: {
        action: "define_initial_project_work",
        workspace_id: fixture.workspace_id,
        project_id: fixture.project_id,
        expected_active_project_id: fixture.project_id,
        expected_active_selection_revision:
          readActiveProjectSelectionV01(fixture.db, fixture.workspace_id)!.selection_revision,
        expected_initialization_state: "not_defined",
        goal: "Bind one managed run to exact current work",
        success_criteria: ["The binding is exact"],
        non_goals: ["Do not grant Start authority"],
      },
      clock: fixedClockV01(LATER),
    });
    const runId = "autonomy-run:cdx2a-binding-matrix";
    const baseMetadata = {
      lifecycle_mode: "managed_live",
      workspace_id: fixture.workspace_id,
      project_id: fixture.project_id,
      invocation_origin: "interactive",
      packet_id: initial.packet.packet_id,
      packet_fingerprint: initial.packet.integrity.fingerprint,
      control_revision: 1,
    };
    insertManagedRunV01(fixture.db, fixture.project_id, runId, baseMetadata);
    const runningLive = {
      ...idleLiveProjectionV01(),
      status: "running" as const,
      run_ref: runId,
      mode: "interactive" as const,
    };
    const exact = await readCodexCurrentContinuityV01(
      fixture.db,
      { generated_at: "2026-08-03T02:00:00.000Z" },
      { ...dependenciesV01(fixture.config), read_live_projection: () => runningLive },
    );
    assert.equal(exact.managed_execution.stage, "running");
    assert.equal(exact.source_status, "exact");
    assert.equal(exact.snapshot.status, "exact");

    const cases: Array<[string, Record<string, unknown>]> = [
      ["missing_packet_id", { ...baseMetadata, packet_id: undefined }],
      ["missing_packet_fingerprint", { ...baseMetadata, packet_fingerprint: undefined }],
      ["mismatched_packet_id", { ...baseMetadata, packet_id: "task-context-packet:other" }],
      ["mismatched_packet_fingerprint", { ...baseMetadata, packet_fingerprint: createCodexCurrentContinuitySnapshotBindingV01({ other: true }) }],
    ];
    for (const [name, metadata] of cases) {
      updateManagedRunMetadataV01(fixture.db, runId, metadata);
      const projection = await readCodexCurrentContinuityV01(
        fixture.db,
        { generated_at: "2026-08-03T02:00:01.000Z" },
        { ...dependenciesV01(fixture.config), read_live_projection: () => runningLive },
      );
      assert.equal(projection.managed_execution.stage, "unavailable_or_inconsistent", name);
      assert.equal(projection.managed_execution.result_available, false, name);
      assert.equal(projection.current_work.start_eligible, false, name);
      assert.notEqual(projection.source_status, "exact", name);
      assert.equal(projection.snapshot.status, "unavailable", name);
      assert.equal(projection.gaps.length, 1, name);
    }
  } finally {
    fixture.db.close();
  }

  const noPacket = createFixtureV01(
    "run-without-current-packet",
    "30000000-0000-4000-8000-000000000012",
  );
  try {
    const runId = "autonomy-run:cdx2a-no-current-packet";
    insertManagedRunV01(noPacket.db, noPacket.project_id, runId, {
      lifecycle_mode: "managed_live",
      workspace_id: noPacket.workspace_id,
      project_id: noPacket.project_id,
      invocation_origin: "interactive",
      packet_id: "task-context-packet:missing",
      packet_fingerprint: createCodexCurrentContinuitySnapshotBindingV01({ missing: "packet" }),
      control_revision: 1,
    });
    const projection = await readCodexCurrentContinuityV01(
      noPacket.db,
      { generated_at: "2026-08-03T02:00:02.000Z" },
      dependenciesV01(noPacket.config),
    );
    assert.equal(projection.managed_execution.stage, "unavailable_or_inconsistent");
    assert.equal(projection.snapshot.status, "unavailable");
    assert.equal(projection.current_work.start_eligible, false);
  } finally {
    noPacket.db.close();
  }

  const historical = createFixtureV01(
    "historical-terminal-run",
    "30000000-0000-4000-8000-000000000013",
  );
  try {
    const initial = defineInitialProjectWorkV01(historical.db, {
      config: historical.config,
      credential: authenticatedSessionV01(historical, "historical-initial"),
      request: {
        action: "define_initial_project_work",
        workspace_id: historical.workspace_id,
        project_id: historical.project_id,
        expected_active_project_id: historical.project_id,
        expected_active_selection_revision:
          readActiveProjectSelectionV01(historical.db, historical.workspace_id)!.selection_revision,
        expected_initialization_state: "not_defined",
        goal: "Preserve a historical result",
        success_criteria: ["Later work remains current"],
        non_goals: [],
      },
      clock: fixedClockV01(LATER),
    });
    const revised = revisePreExecutionProjectWorkV01(historical.db, {
      config: historical.config,
      credential: authenticatedSessionV01(historical, "historical-revision"),
      request: revisionRequestV01(historical, initial.packet),
      clock: fixedClockV01("2026-08-03T02:00:03.000Z"),
    });
    const runId = "autonomy-run:cdx2a-historical";
    const resultFixture: SemanticReviewLoopProjectFixtureV01 = {
      fixture_id: "cdx2a-historical",
      workspace_id: historical.workspace_id,
      project_id: historical.project_id,
      run_id: runId,
    };
    const receipt = buildSemanticReviewLoopRunReceiptFixture(
      resultFixture,
      initial.packet,
      { timeline_anchor_at: "2026-08-03T02:00:04.000Z" },
    );
    insertVNextCoreRecordV01(historical.db, {
      record_kind: "run_receipt",
      record_id: receipt.receipt_id,
      workspace_id: historical.workspace_id,
      project_id: historical.project_id,
      fingerprint: receipt.integrity.fingerprint,
      idempotency_key: receipt.idempotency_key,
      payload: receipt,
      created_at: receipt.recorded_at,
    });
    insertManagedRunV01(historical.db, historical.project_id, runId, {
      lifecycle_mode: "managed_live",
      workspace_id: historical.workspace_id,
      project_id: historical.project_id,
      invocation_origin: "interactive",
      packet_id: initial.packet.packet_id,
      packet_fingerprint: initial.packet.integrity.fingerprint,
      control_revision: 1,
      terminal_receipt_persisted: true,
      run_receipt_id: receipt.receipt_id,
      run_receipt_fingerprint: receipt.integrity.fingerprint,
    }, "needs_review");
    historical.db.prepare(
      "UPDATE autonomy_runs SET created_at = ?, updated_at = ?, finished_at = ? WHERE run_id = ?",
    ).run(
      "2026-08-03T02:00:04.000Z",
      "2026-08-03T02:00:04.000Z",
      "2026-08-03T02:00:04.000Z",
      runId,
    );
    const projection = await readCodexCurrentContinuityV01(
      historical.db,
      { generated_at: "2026-08-03T02:00:05.000Z" },
      dependenciesV01(historical.config),
    );
    assert.equal(projection.current_work.lineage_kind, "pre_execution_user_revision");
    assert.equal(projection.latest_result.state, "result_present");
    assert.equal(projection.latest_result.currentness, "stale");
    assert.equal(projection.managed_execution.stage, "no_run");
    assert.equal(projection.managed_execution.result_available, false);
    assert.notEqual(projection.next_action.kind, "start_current_work");
    assert.notEqual(revised.packet.packet_id, initial.packet.packet_id);
  } finally {
    historical.db.close();
  }
}

async function assertCurrentWorkResolutionStatesV01(): Promise<void> {
  const multiple = createFixtureV01(
    "multiple-current-work",
    "30000000-0000-4000-8000-000000000021",
  );
  try {
    const credential = authenticatedSessionV01(multiple, "multiple-current");
    const selection = readActiveProjectSelectionV01(
      multiple.db,
      multiple.workspace_id,
    )!;
    for (const [index, goal] of ["First current candidate", "Second current candidate"].entries()) {
      const built = buildInitialProjectWorkTaskContextPacketV01({
        workspace_id: multiple.workspace_id,
        project_id: multiple.project_id,
        operator_id: multiple.config.operator_id,
        session_id: credential.session_id,
        expected_active_selection_revision: selection.selection_revision,
        definition: {
          goal,
          success_criteria: [`Candidate ${index + 1} remains bounded`],
          non_goals: [],
        },
        generated_at: `2026-08-03T03:00:0${index + 1}.000Z`,
      });
      insertVNextCoreRecordV01(multiple.db, {
        record_kind: "task_context_packet",
        record_id: built.packet.packet_id,
        workspace_id: multiple.workspace_id,
        project_id: multiple.project_id,
        fingerprint: built.packet.integrity.fingerprint,
        idempotency_key: built.lineage.idempotency_key,
        payload: built.packet,
        created_at: built.packet.generated_at,
      });
    }
    const projection = await readCodexCurrentContinuityV01(
      multiple.db,
      { generated_at: "2026-08-03T03:00:03.000Z" },
      dependenciesV01(multiple.config),
    );
    assert.equal(projection.current_work.status, "current_work_ambiguous");
    assert.equal(projection.current_work.start_eligible, false);
    assert.equal(projection.snapshot.status, "unavailable");
    assert.match(projection.gaps.join(" "), /More than one current work packet/u);
  } finally {
    multiple.db.close();
  }

  const malformed = createFixtureV01(
    "malformed-current-work",
    "30000000-0000-4000-8000-000000000022",
  );
  try {
    insertVNextCoreRecordV01(malformed.db, {
      record_kind: "task_context_packet",
      record_id: "task-context-packet:malformed-cdx2a",
      workspace_id: malformed.workspace_id,
      project_id: malformed.project_id,
      fingerprint: createCodexCurrentContinuitySnapshotBindingV01({ malformed: true }),
      idempotency_key: null,
      payload: { packet_id: "task-context-packet:malformed-cdx2a" },
      created_at: "2026-08-03T03:01:00.000Z",
    });
    const projection = await readCodexCurrentContinuityV01(
      malformed.db,
      { generated_at: "2026-08-03T03:01:01.000Z" },
      dependenciesV01(malformed.config),
    );
    assert.equal(projection.current_work.status, "current_work_unavailable");
    assert.equal(projection.current_work.start_eligible, false);
    assert.equal(projection.snapshot.status, "unavailable");
    assert.match(projection.gaps.join(" "), /malformed/u);
  } finally {
    malformed.db.close();
  }

  const invalidRevision = createFixtureV01(
    "invalid-revision-work",
    "30000000-0000-4000-8000-000000000023",
  );
  try {
    const initial = defineInitialProjectWorkV01(invalidRevision.db, {
      config: invalidRevision.config,
      credential: authenticatedSessionV01(invalidRevision, "invalid-revision-initial"),
      request: {
        action: "define_initial_project_work",
        workspace_id: invalidRevision.workspace_id,
        project_id: invalidRevision.project_id,
        expected_active_project_id: invalidRevision.project_id,
        expected_active_selection_revision:
          readActiveProjectSelectionV01(invalidRevision.db, invalidRevision.workspace_id)!.selection_revision,
        expected_initialization_state: "not_defined",
        goal: "Create a valid revision origin",
        success_criteria: ["Invalid successor fails closed"],
        non_goals: [],
      },
      clock: fixedClockV01("2026-08-03T03:02:00.000Z"),
    });
    const origin = inspectInitialProjectWorkPacketLineageV01(invalidRevision.db, {
      workspace_id: invalidRevision.workspace_id,
      project_id: invalidRevision.project_id,
      packet: initial.packet,
    }).definition_ref;
    const credential = authenticatedSessionV01(invalidRevision, "invalid-revision-successor");
    const definition = {
      goal: "Invalid revision successor",
      success_criteria: ["The relation is refused"],
      non_goals: [],
    };
    const built = buildPreExecutionProjectWorkRevisionPacketV01({
      request: {
        ...revisionRequestV01(invalidRevision, initial.packet),
        goal: definition.goal,
        success_criteria: definition.success_criteria,
        non_goals: definition.non_goals,
      },
      operator_id: invalidRevision.config.operator_id,
      session_id: credential.session_id,
      revision_number: 1,
      definition,
      prior_packet: initial.packet,
      origin_first_work_definition_ref: {
        ...origin,
        external_id: `${origin.external_id}:wrong`,
      },
      generated_at: "2026-08-03T03:02:01.000Z",
    });
    insertVNextCoreRecordV01(invalidRevision.db, {
      record_kind: "task_context_packet",
      record_id: built.packet.packet_id,
      workspace_id: invalidRevision.workspace_id,
      project_id: invalidRevision.project_id,
      fingerprint: built.packet.integrity.fingerprint,
      idempotency_key: built.lineage.idempotency_key,
      payload: built.packet,
      created_at: built.packet.generated_at,
    });
    const projection = await readCodexCurrentContinuityV01(
      invalidRevision.db,
      { generated_at: "2026-08-03T03:02:02.000Z" },
      dependenciesV01(invalidRevision.config),
    );
    assert.equal(projection.current_work.status, "current_work_unavailable");
    assert.match(projection.gaps.join(" "), /revision lineage is invalid/u);
    assert.equal(projection.snapshot.status, "unavailable");
  } finally {
    invalidRevision.db.close();
  }

  const invalidTransition = createFixtureV01(
    "invalid-transition-work",
    "30000000-0000-4000-8000-000000000024",
  );
  try {
    const project: SemanticReviewLoopProjectFixtureV01 = {
      fixture_id: "cdx2a-invalid-transition",
      workspace_id: invalidTransition.workspace_id,
      project_id: invalidTransition.project_id,
      run_id: "run:cdx2a-invalid-transition",
    };
    const base = buildSemanticTransitionLoopFixtureV01(project).later_packet;
    const later = buildTaskContextPacketV01({
      workspace_id: base.workspace_id,
      project_id: base.project_id,
      work_ref: base.work_ref,
      generated_at: base.generated_at,
      expires_at: base.expires_at,
      task: base.task,
      current_projection: base.current_projection,
      selected_context: base.selected_context,
      excluded_context: base.excluded_context,
      tensions: base.tensions,
      risks: base.risks,
      gaps: base.gaps,
      constraints: base.constraints,
      capability_grant: base.capability_grant,
      return_contract: base.return_contract,
      source_status: base.source_status,
      compatibility: {
        ...base.compatibility,
        source_contracts: [
          ...base.compatibility.source_contracts,
          VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
        ],
      },
      authority_notes: base.authority_summary.notes,
    });
    insertVNextCoreRecordV01(invalidTransition.db, {
      record_kind: "task_context_packet",
      record_id: later.packet_id,
      workspace_id: invalidTransition.workspace_id,
      project_id: invalidTransition.project_id,
      fingerprint: later.integrity.fingerprint,
      idempotency_key: null,
      payload: later,
      created_at: later.generated_at,
    });
    const projection = await readCodexCurrentContinuityV01(
      invalidTransition.db,
      { generated_at: "2026-08-03T03:03:00.000Z" },
      dependenciesV01(invalidTransition.config),
    );
    assert.equal(projection.current_work.status, "current_work_unavailable");
    assert.match(projection.gaps.join(" "), /semantic-transition work lineage is invalid/u);
    assert.equal(projection.current_work.start_eligible, false);
  } finally {
    invalidTransition.db.close();
  }

  const durableOnly = createFixtureV01(
    "durable-history-without-current-work",
    "30000000-0000-4000-8000-000000000025",
  );
  try {
    const project: SemanticReviewLoopProjectFixtureV01 = {
      fixture_id: "cdx2a-durable-only",
      workspace_id: durableOnly.workspace_id,
      project_id: durableOnly.project_id,
      run_id: "run:cdx2a-durable-only",
    };
    const unpersistedPacket = buildSemanticReviewLoopTaskContextPacketFixture(project);
    const receipt = buildSemanticReviewLoopRunReceiptFixture(project, unpersistedPacket);
    insertVNextCoreRecordV01(durableOnly.db, {
      record_kind: "run_receipt",
      record_id: receipt.receipt_id,
      workspace_id: durableOnly.workspace_id,
      project_id: durableOnly.project_id,
      fingerprint: receipt.integrity.fingerprint,
      idempotency_key: receipt.idempotency_key,
      payload: receipt,
      created_at: receipt.recorded_at,
    });
    const projection = await readCodexCurrentContinuityV01(
      durableOnly.db,
      { generated_at: "2026-08-03T03:04:00.000Z" },
      dependenciesV01(durableOnly.config),
    );
    assert.equal(projection.current_work.status, "current_work_unavailable");
    assert.match(projection.gaps.join(" "), /without one provable current packet/u);
    assert.equal(projection.current_work.start_eligible, false);
    assert.equal(projection.latest_result.currentness, "unavailable_or_ambiguous");
    assert.equal(projection.snapshot.status, "unavailable");
  } finally {
    durableOnly.db.close();
  }
}

interface SemanticOwnerFixtureV01 {
  fixture: FixtureV01;
  project: SemanticReviewLoopProjectFixtureV01;
  packet: TaskContextPacketV01;
  receipt: ReturnType<typeof buildSemanticReviewLoopRunReceiptFixture>;
  proposal: ReturnType<typeof buildSemanticReviewLoopProposalFixture>;
}

async function assertSemanticContinuityOwnerPathsV01(): Promise<void> {
  const pending = createSemanticOwnerFixtureV01(
    "semantic-pending",
    "30000000-0000-4000-8000-000000000031",
  );
  try {
    insertRunReceiptV01(pending);
    try {
      inspectVNextOperatorPilotPacketLineageV01(pending.fixture.db, {
        config: pending.fixture.config,
        packet_id: pending.packet.packet_id,
        packet_fingerprint: pending.packet.integrity.fingerprint,
      });
    } catch (error) {
      throw new Error(`semantic_pending_packet_lineage:${error instanceof Error ? error.message : String(error)}`);
    }
    const currentResult = await readCodexCurrentContinuityV01(
      pending.fixture.db,
      { generated_at: "2026-07-10T12:30:00.000Z" },
      dependenciesV01(pending.fixture.config),
    );
    assert.equal(currentResult.latest_result.state, "result_present");
    assert.equal(
      currentResult.latest_result.currentness,
      "current",
      JSON.stringify({ work: currentResult.current_work, result: currentResult.latest_result, gaps: currentResult.gaps }),
    );
    assert.equal(currentResult.review_continuity.state, "no_proposal");
    insertProposalV01(pending);
    const projection = await readCodexCurrentContinuityV01(
      pending.fixture.db,
      { generated_at: "2026-07-10T12:31:00.000Z" },
      dependenciesV01(pending.fixture.config),
    );
    assert.equal(projection.review_continuity.state, "proposal_present_decision_pending");
    assert.equal(projection.next_action.kind, "record_decision");
  } finally {
    pending.fixture.db.close();
  }

  const rejected = createSemanticOwnerFixtureV01(
    "semantic-rejected",
    "30000000-0000-4000-8000-000000000032",
  );
  try {
    insertRunReceiptV01(rejected);
    insertProposalV01(rejected);
    recordPilotDecisionV01(rejected, "reject", "2026-07-10T13:00:00.000Z");
    const projection = await readCodexCurrentContinuityV01(
      rejected.fixture.db,
      { generated_at: "2026-07-10T13:30:00.000Z" },
      dependenciesV01(rejected.fixture.config),
    );
    assert.equal(projection.review_continuity.state, "decision_recorded");
    assert.match(projection.review_continuity.summary, /Decision is recorded/u);
    assert.notEqual(projection.review_continuity.state, "transition_applied");
  } finally {
    rejected.fixture.db.close();
  }

  const superseded = createSemanticOwnerFixtureV01(
    "semantic-superseded-without-current-packet",
    "30000000-0000-4000-8000-000000000038",
  );
  try {
    insertRunReceiptV01(superseded);
    insertProposalV01(superseded);
    const decision = buildReviewDecisionV01(
      createSemanticTransitionDecisionInputV01(
        superseded.project,
        superseded.proposal,
      ),
    );
    insertVNextCoreRecordV01(superseded.fixture.db, {
      record_kind: "review_decision",
      record_id: decision.decision_id,
      workspace_id: superseded.fixture.workspace_id,
      project_id: superseded.fixture.project_id,
      fingerprint: decision.integrity.fingerprint,
      idempotency_key: null,
      payload: decision,
      created_at: decision.decided_at,
    });
    const preview = prepareVNextSemanticCommitPreviewV01(
      superseded.fixture.db,
      {
        workspace_id: superseded.fixture.workspace_id,
        project_id: superseded.fixture.project_id,
        proposal_id: superseded.proposal.proposal_id,
        proposal_fingerprint: superseded.proposal.integrity.fingerprint,
        decision_id: decision.decision_id,
        decision_fingerprint: decision.integrity.fingerprint,
        authorized_applier_identity: {
          ref_type: "semantic_transition_applier",
          external_id: "cdx2a-superseded-owner-path",
        },
        gate_ttl_ms:
          Date.parse(DURABLE_LOCAL_LOOP_GATE_EXPIRES_AT) -
          Date.parse(DURABLE_LOCAL_LOOP_GATE_EVALUATED_AT),
        clock: sequenceClockV01(
          DURABLE_LOCAL_LOOP_CURRENT_STATE_OBSERVED_AT,
          DURABLE_LOCAL_LOOP_PREVIEWED_AT,
        ),
      },
    );
    const authorization = recordVNextSemanticCommitAuthorizationV01(
      superseded.fixture.db,
      {
        preview,
        confirmation_digest: preview.confirmation_digest,
        operator_actor_ref: decision.actor_ref,
        clock: sequenceClockV01(
          DURABLE_LOCAL_LOOP_CONFIRMED_AT,
          DURABLE_LOCAL_LOOP_GATE_EVALUATED_AT,
          DURABLE_LOCAL_LOOP_ELIGIBILITY_EVALUATED_AT,
        ),
      },
    );
    const transition = commitVNextSemanticTransitionV01(
      superseded.fixture.db,
      {
        workspace_id: superseded.fixture.workspace_id,
        project_id: superseded.fixture.project_id,
        proposal_id: superseded.proposal.proposal_id,
        proposal_fingerprint: superseded.proposal.integrity.fingerprint,
        decision_id: decision.decision_id,
        decision_fingerprint: decision.integrity.fingerprint,
        gate_record_id: authorization.gate_record.gate_record_id,
        gate_record_fingerprint:
          authorization.gate_record.integrity.fingerprint,
        clock: sequenceClockV01(
          DURABLE_LOCAL_LOOP_APPLIED_AT,
          DURABLE_LOCAL_LOOP_RECORDED_AT,
        ),
      },
    );
    assert.equal(transition.status, "applied");
    const projection = await readCodexCurrentContinuityV01(
      superseded.fixture.db,
      { generated_at: "2026-07-10T14:06:30.000Z" },
      dependenciesV01(superseded.fixture.config),
    );
    assert.equal(projection.current_work.status, "stale_current_work");
    assert.equal(projection.current_work.currentness, "stale");
    assert.equal(projection.current_work.start_eligible, false);
  } finally {
    superseded.fixture.db.close();
  }

  const accepted = createSemanticOwnerFixtureV01(
    "semantic-accepted",
    "30000000-0000-4000-8000-000000000033",
  );
  try {
    insertRunReceiptV01(accepted);
    insertProposalV01(accepted);
    const decisionResult = recordPilotDecisionV01(
      accepted,
      "accept",
      "2026-07-10T13:00:00.000Z",
    );
    const decision = decisionResult.decision;
    const awaiting = await readCodexCurrentContinuityV01(
      accepted.fixture.db,
      { generated_at: "2026-07-10T13:30:00.000Z" },
      dependenciesV01(accepted.fixture.config),
    );
    assert.equal(
      awaiting.review_continuity.state,
      "accepted_decision_awaiting_transition",
      JSON.stringify({ work: awaiting.current_work, result: awaiting.latest_result, review: awaiting.review_continuity, gaps: awaiting.gaps }),
    );
    assert.equal(awaiting.next_action.kind, "complete_authorized_transition");

    const exactDecision = {
      proposal_id: accepted.proposal.proposal_id,
      proposal_fingerprint: accepted.proposal.integrity.fingerprint,
      decision_id: decision.decision_id,
      decision_fingerprint: decision.integrity.fingerprint,
    };
    const preview = prepareVNextOperatorPilotSemanticCommitPreviewV01(
      accepted.fixture.db,
      {
        config: accepted.fixture.config,
        credential: decisionResult.credential,
        request: exactDecision,
        clock: sequenceClockV01(
          "2026-07-10T13:01:00.000Z",
          "2026-07-10T13:01:01.000Z",
        ),
      },
    );
    const authorization = confirmVNextOperatorPilotSemanticCommitV01(
      accepted.fixture.db,
      {
        config: accepted.fixture.config,
        credential: decisionResult.credential,
        preview_binding_cookie: preview.preview_binding_cookie,
        request: {
          ...exactDecision,
          confirmation_digest: preview.preview.confirmation_digest,
        },
        clock: fixedClockV01("2026-07-10T13:02:00.000Z"),
      },
    );
    const appliedTransition = applyVNextOperatorPilotReviewedSemanticTransitionV01(
      accepted.fixture.db,
      {
        config: accepted.fixture.config,
        credential: credentialFromCookieV01(
          authorization.session_admission.cookie_value,
        ),
        request: {
          ...exactDecision,
          gate_record_id: authorization.gate_record.gate_record_id,
          gate_record_fingerprint:
            authorization.gate_record.integrity.fingerprint,
          prior_packet_id: accepted.packet.packet_id,
          prior_packet_fingerprint: accepted.packet.integrity.fingerprint,
        },
        clock: sequenceClockV01(
          "2026-07-10T13:03:00.000Z",
          "2026-07-10T13:03:01.000Z",
          "2026-07-10T13:03:02.000Z",
          "2026-07-10T13:03:03.000Z",
          "2026-07-10T13:03:04.000Z",
        ),
      },
    );
    assert.equal(appliedTransition.status, "applied");
    const compiled = { later_packet: appliedTransition.later_packet };
    try {
      inspectVNextOperatorPilotPacketLineageV01(accepted.fixture.db, {
        config: accepted.fixture.config,
        packet_id: compiled.later_packet.packet_id,
        packet_fingerprint: compiled.later_packet.integrity.fingerprint,
      });
    } catch (error) {
      throw new Error(`semantic_compiled_packet_lineage:${error instanceof Error ? error.message : String(error)}`);
    }
    try {
      projectVNextOperatorPilotContinuityV01(accepted.fixture.db, {
        config: accepted.fixture.config,
        clock: fixedClockV01("2026-07-10T13:04:00.000Z"),
      });
    } catch (error) {
      throw new Error(`semantic_compiled_continuity:${error instanceof Error ? error.message : String(error)}`);
    }
    const applied = await readCodexCurrentContinuityV01(
      accepted.fixture.db,
      { generated_at: "2026-07-10T13:04:00.000Z" },
      dependenciesV01(accepted.fixture.config),
    );
    assert.equal(applied.current_work.lineage_kind, "semantic_transition");
    assert.equal(
      applied.current_work.currentness,
      "fresh",
      JSON.stringify({ work: applied.current_work, gaps: applied.gaps }),
    );
    assert.equal(applied.latest_result.currentness, "stale");
    assert.equal(applied.review_continuity.state, "transition_applied");

    const laterProject = {
      ...accepted.project,
      fixture_id: "semantic-accepted-later-result",
      run_id: "run:semantic-accepted-later-result",
    };
    const laterReceipt = buildSemanticReviewLoopRunReceiptFixture(
      laterProject,
      compiled.later_packet,
      { timeline_anchor_at: "2026-07-10T16:00:00.000Z" },
    );
    insertVNextCoreRecordV01(accepted.fixture.db, {
      record_kind: "run_receipt",
      record_id: laterReceipt.receipt_id,
      workspace_id: accepted.fixture.workspace_id,
      project_id: accepted.fixture.project_id,
      fingerprint: laterReceipt.integrity.fingerprint,
      idempotency_key: laterReceipt.idempotency_key,
      payload: laterReceipt,
      created_at: laterReceipt.recorded_at,
    });
    const unrelatedHistorical = await readCodexCurrentContinuityV01(
      accepted.fixture.db,
      { generated_at: "2026-07-10T16:10:00.000Z" },
      dependenciesV01(accepted.fixture.config),
    );
    assert.equal(unrelatedHistorical.latest_result.currentness, "current");
    assert.equal(unrelatedHistorical.review_continuity.state, "no_proposal");
    assert.notEqual(unrelatedHistorical.review_continuity.state, "transition_applied");

    const staleProject = {
      ...accepted.project,
      fixture_id: "semantic-accepted-stale-result",
      run_id: "run:semantic-accepted-stale-result",
    };
    const staleReceipt = buildSemanticReviewLoopRunReceiptFixture(
      staleProject,
      accepted.packet,
      { timeline_anchor_at: "2026-07-10T17:00:00.000Z" },
    );
    const staleProposal = buildSemanticReviewLoopProposalFixture(
      staleProject,
      accepted.packet,
      staleReceipt,
      { timeline_anchor_at: "2026-07-10T17:03:00.000Z" },
    );
    insertVNextCoreRecordV01(accepted.fixture.db, {
      record_kind: "run_receipt",
      record_id: staleReceipt.receipt_id,
      workspace_id: accepted.fixture.workspace_id,
      project_id: accepted.fixture.project_id,
      fingerprint: staleReceipt.integrity.fingerprint,
      idempotency_key: staleReceipt.idempotency_key,
      payload: staleReceipt,
      created_at: staleReceipt.recorded_at,
    });
    const staleOwner: SemanticOwnerFixtureV01 = {
      ...accepted,
      project: staleProject,
      receipt: staleReceipt,
      proposal: staleProposal,
    };
    recordPilotDecisionV01(
      staleOwner,
      "accept",
      "2026-07-10T17:05:00.000Z",
    );
    const blocked = await readCodexCurrentContinuityV01(
      accepted.fixture.db,
      { generated_at: "2026-07-10T17:10:00.000Z" },
      dependenciesV01(accepted.fixture.config),
    );
    assert.equal(
      blocked.latest_result.currentness,
      "stale",
      JSON.stringify({ work: blocked.current_work, result: blocked.latest_result, review: blocked.review_continuity, gaps: blocked.gaps }),
    );
    assert.equal(blocked.review_continuity.state, "transition_blocked");
    assert.equal(blocked.next_action.kind, "review_proposal");

  } finally {
    accepted.fixture.db.close();
  }

  for (const [kind, uuid] of [
    ["proposal", "30000000-0000-4000-8000-000000000035"],
    ["decision", "30000000-0000-4000-8000-000000000036"],
    ["transition", "30000000-0000-4000-8000-000000000037"],
  ] as const) {
    const invalid = createSemanticOwnerFixtureV01(
      `semantic-malformed-${kind}`,
      uuid,
    );
    try {
      insertRunReceiptV01(invalid);
      if (kind === "proposal") {
        const payload = structuredClone(invalid.proposal);
        payload.run_receipt_refs[0]!.source_ref =
          createCodexCurrentContinuitySnapshotBindingV01({ malformed: kind });
        insertVNextCoreRecordV01(invalid.fixture.db, {
          record_kind: "episode_delta_proposal",
          record_id: invalid.proposal.proposal_id,
          workspace_id: invalid.fixture.workspace_id,
          project_id: invalid.fixture.project_id,
          fingerprint: invalid.proposal.integrity.fingerprint,
          idempotency_key: null,
          payload,
          created_at: invalid.proposal.created_at,
        });
      } else if (kind === "decision") {
        insertProposalV01(invalid);
        const decision = buildReviewDecisionV01(
          createSemanticTransitionDecisionInputV01(
            invalid.project,
            invalid.proposal,
          ),
        );
        const payload = structuredClone(decision);
        payload.source_proposal.proposal_fingerprint =
          createCodexCurrentContinuitySnapshotBindingV01({ malformed: kind });
        insertVNextCoreRecordV01(invalid.fixture.db, {
          record_kind: "review_decision",
          record_id: decision.decision_id,
          workspace_id: invalid.fixture.workspace_id,
          project_id: invalid.fixture.project_id,
          fingerprint: decision.integrity.fingerprint,
          idempotency_key: null,
          payload,
          created_at: decision.decided_at,
        });
      } else {
        const transition = buildSemanticTransitionLoopFixtureV01(
          invalid.project,
        ).transition_receipt;
        const payload = structuredClone(transition);
        payload.source_decision.decision_fingerprint =
          createCodexCurrentContinuitySnapshotBindingV01({ malformed: kind });
        insertVNextCoreRecordV01(invalid.fixture.db, {
          record_kind: "state_transition_receipt",
          record_id: transition.transition_receipt_id,
          workspace_id: invalid.fixture.workspace_id,
          project_id: invalid.fixture.project_id,
          fingerprint: transition.integrity.fingerprint,
          idempotency_key: transition.idempotency_key,
          payload,
          created_at: transition.recorded_at,
        });
      }
      const projection = await readCodexCurrentContinuityV01(
        invalid.fixture.db,
        { generated_at: "2026-07-10T13:31:00.000Z" },
        dependenciesV01(invalid.fixture.config),
      );
      assert.notEqual(projection.source_status, "exact", kind);
      assert.equal(projection.snapshot.status, "unavailable", kind);
      assert.notEqual(projection.review_continuity.state, "transition_applied", kind);
    } finally {
      invalid.fixture.db.close();
    }
  }
}

function createSemanticOwnerFixtureV01(
  name: string,
  uuid: string,
): SemanticOwnerFixtureV01 {
  const fixture = createFixtureV01(name, uuid);
  const selection = readActiveProjectSelectionV01(
    fixture.db,
    fixture.workspace_id,
  )!;
  const credential = authenticatedSessionAtV01(
    fixture,
    `${name}-initial`,
    "2026-07-10T00:00:00.000Z",
    "2026-07-10T00:01:00.000Z",
  );
  const initial = buildInitialProjectWorkTaskContextPacketV01({
    workspace_id: fixture.workspace_id,
    project_id: fixture.project_id,
    operator_id: fixture.config.operator_id,
    session_id: credential.session_id,
    expected_active_selection_revision: selection.selection_revision,
    definition: {
      goal: "Read exact semantic continuity",
      success_criteria: ["Canonical review relations remain exact"],
      non_goals: ["Do not infer authority"],
    },
    generated_at: "2026-07-10T01:00:00.000Z",
  });
  insertVNextCoreRecordV01(fixture.db, {
    record_kind: "task_context_packet",
    record_id: initial.packet.packet_id,
    workspace_id: fixture.workspace_id,
    project_id: fixture.project_id,
    fingerprint: initial.packet.integrity.fingerprint,
    idempotency_key: initial.lineage.idempotency_key,
    payload: initial.packet,
    created_at: initial.packet.generated_at,
  });
  const project: SemanticReviewLoopProjectFixtureV01 = {
    fixture_id: name,
    workspace_id: fixture.workspace_id,
    project_id: fixture.project_id,
    run_id: `run:${name}`,
  };
  const receipt = buildSemanticReviewLoopRunReceiptFixture(project, initial.packet);
  return {
    fixture,
    project,
    packet: initial.packet,
    receipt,
    proposal: buildSemanticReviewLoopProposalFixture(
      project,
      initial.packet,
      receipt,
    ),
  };
}

function insertRunReceiptV01(input: SemanticOwnerFixtureV01): void {
  insertVNextCoreRecordV01(input.fixture.db, {
    record_kind: "run_receipt",
    record_id: input.receipt.receipt_id,
    workspace_id: input.fixture.workspace_id,
    project_id: input.fixture.project_id,
    fingerprint: input.receipt.integrity.fingerprint,
    idempotency_key: input.receipt.idempotency_key,
    payload: input.receipt,
    created_at: input.receipt.recorded_at,
  });
}

function insertProposalV01(input: SemanticOwnerFixtureV01): void {
  insertVNextCoreRecordV01(input.fixture.db, {
    record_kind: "episode_delta_proposal",
    record_id: input.proposal.proposal_id,
    workspace_id: input.fixture.workspace_id,
    project_id: input.fixture.project_id,
    fingerprint: input.proposal.integrity.fingerprint,
    idempotency_key: null,
    payload: input.proposal,
    created_at: input.proposal.created_at,
  });
}

function recordPilotDecisionV01(
  input: SemanticOwnerFixtureV01,
  decision: "accept" | "reject",
  decidedAt: string,
) {
  insertProposalV01(input);
  const review = readVNextOperatorPilotSemanticReviewV01(input.fixture.db, {
    config: input.fixture.config,
    proposal_id: input.proposal.proposal_id,
    authenticated_session_id: null,
  });
  const admission = review.candidate_admissions.find(
    (candidate) => candidate.decision_allowed.accept,
  );
  const candidate = input.proposal.proposed_deltas.find(
    (value) =>
      value.candidate_id === admission?.candidate_id &&
      createEpisodeDeltaCandidateFingerprintV01(value) ===
        admission.candidate_fingerprint,
  );
  if (!candidate) throw new Error("cdx2a_semantic_candidate_missing");
  const decidedMs = Date.parse(decidedAt);
  const credential = authenticatedSessionForCurrentOperatorAtV01(
    input.fixture,
    new Date(decidedMs - 120_000).toISOString(),
    new Date(decidedMs - 60_000).toISOString(),
  );
  const result = recordVNextOperatorPilotReviewDecisionV01(input.fixture.db, {
    config: input.fixture.config,
    credential,
    request: {
      proposal_id: input.proposal.proposal_id,
      proposal_fingerprint: input.proposal.integrity.fingerprint,
      candidate_id: candidate.candidate_id,
      candidate_fingerprint:
        createEpisodeDeltaCandidateFingerprintV01(candidate),
      decision,
      rationale_summary:
        decision === "accept"
          ? "Accept this bounded candidate for exact CDX2A continuity coverage."
          : "Reject this bounded candidate without applying project meaning.",
      revisit: null,
    },
    clock: fixedClockV01(decidedAt),
  });
  return {
    decision: result.decision,
    credential: credentialFromCookieV01(result.session_cookie.value),
  };
}

function credentialFromCookieV01(
  value: string,
): VNextLocalOperatorSessionCredentialV01 {
  return readVNextLocalOperatorCredentialFromRequestV01(
    new Request("http://127.0.0.1/api/vnext/operator/semantic-review", {
      headers: {
        cookie: `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${value}`,
      },
    }),
  );
}

async function assertExactOwnerStatesV01(): Promise<void> {
  const emptyDb = createDatabaseV01(path.join(ROOT, "empty.db"));
  try {
    const first = await readCodexCurrentContinuityV01(emptyDb, { generated_at: NOW });
    const second = await readCodexCurrentContinuityV01(emptyDb, { generated_at: LATER });
    assert.equal(first.project.status, "no_workspace");
    assert.equal(first.next_action.kind, "choose_project");
    assert.equal(first.snapshot.binding, second.snapshot.binding);
    assert.notEqual(first.generated_at, second.generated_at);
    assert.equal(exitCodeForProjection(first), 0);
  } finally {
    emptyDb.close();
  }

  const noActiveDb = createDatabaseV01(path.join(ROOT, "no-active.db"));
  try {
    getOrCreateDefaultWorkspaceIdentityV01(noActiveDb, {
      create_uuid: () => "20000000-0000-4000-8000-000000000009",
      now: () => NOW,
    });
    const noActive = await readCodexCurrentContinuityV01(
      noActiveDb,
      { generated_at: NOW },
    );
    assert.equal(noActive.project.status, "no_active_project");
    assert.equal(noActive.next_action.kind, "choose_project");
    assert.equal(exitCodeForProjection(noActive), 0);
  } finally {
    noActiveDb.close();
  }

  const fixture = createFixtureV01("primary", "30000000-0000-4000-8000-000000000001");
  const other = registerProjectV01(
    fixture.db,
    fixture.workspace_id,
    path.join(ROOT, "secondary"),
    "CDX2A secondary",
    "30000000-0000-4000-8000-000000000002",
  );
  try {
    const deps = dependenciesV01(fixture.config);
    const beforeBytes = hashV01(fixture.db.serialize());
    const beforeReadme = hashV01(readFileSync(path.join(fixture.root, "README.md")));
    const noWork = await readCodexCurrentContinuityV01(fixture.db, { generated_at: NOW }, deps);
    assert.equal(noWork.project.status, "active_project");
    assert.equal(noWork.project.project_key?.startsWith("sha256:"), true);
    assert.equal(JSON.stringify(noWork).includes(fixture.root), false);
    assert.equal(noWork.current_work.status, "no_current_work");
    assert.equal(noWork.current_work.start_eligible, false);
    assert.equal(noWork.next_action.kind, "define_work");
    assert.equal(exitCodeForProjection(noWork), 0);
    assert.equal(hashV01(fixture.db.serialize()), beforeBytes);
    assert.equal(hashV01(readFileSync(path.join(fixture.root, "README.md"))), beforeReadme);

    const inactive = await readCodexCurrentContinuityV01(
      fixture.db,
      { viewed_project_id: other.project.project_id, generated_at: NOW },
      dependenciesV01({ ...fixture.config, project_id: other.project.project_id }),
    );
    assert.equal(inactive.project.status, "inactive_project");
    assert.equal(inactive.next_action.kind, "make_project_active");

    const missingRoot = await readCodexCurrentContinuityV01(
      fixture.db,
      { generated_at: NOW },
      { ...deps, read_root_availability: async () => "missing" },
    );
    assert.equal(missingRoot.project.status, "active_project_root_unavailable");
    assert.equal(missingRoot.next_action.kind, "restore_project_root");
    assert.notEqual(missingRoot.snapshot.binding, noWork.snapshot.binding);

    const initial = defineInitialProjectWorkV01(fixture.db, {
      config: fixture.config,
      credential: authenticatedSessionV01(fixture, "initial"),
      request: {
        action: "define_initial_project_work",
        workspace_id: fixture.workspace_id,
        project_id: fixture.project_id,
        expected_active_project_id: fixture.project_id,
        expected_active_selection_revision:
          readActiveProjectSelectionV01(fixture.db, fixture.workspace_id)!.selection_revision,
        expected_initialization_state: "not_defined",
        goal: "Read the exact current continuity",
        success_criteria: ["Current work remains exact", "Reads have zero effect"],
        non_goals: ["Do not start Codex"],
      },
      clock: fixedClockV01(LATER),
    });
    const afterInitial = await readCodexCurrentContinuityV01(
      fixture.db,
      { generated_at: LATER },
      dependenciesV01(fixture.config),
    );
    assert.equal(afterInitial.current_work.lineage_kind, "initial_user_defined");
    assert.equal(afterInitial.current_work.currentness, "fresh");
    assert.equal(afterInitial.current_work.start_eligible, true);
    assert.equal(afterInitial.next_action.kind, "start_current_work");
    assert.notEqual(afterInitial.snapshot.binding, noWork.snapshot.binding);
    const unavailableOperator = await readCodexCurrentContinuityV01(
      fixture.db,
      { generated_at: "2026-08-03T00:00:02.000Z" },
      { ...dependenciesV01(fixture.config), read_operator_config: () => null },
    );
    assert.equal(unavailableOperator.current_work.start_eligible, false);
    assert.match(unavailableOperator.current_work.start_blocker ?? "", /configuration is unavailable/u);
    assert.notEqual(unavailableOperator.snapshot.binding, afterInitial.snapshot.binding);
    assert.notEqual(unavailableOperator.next_action.kind, afterInitial.next_action.kind);

    const revised = revisePreExecutionProjectWorkV01(fixture.db, {
      config: fixture.config,
      credential: authenticatedSessionV01(fixture, "revision"),
      request: revisionRequestV01(fixture, initial.packet),
      clock: fixedClockV01("2026-08-03T00:00:03.000Z"),
    });
    const afterRevision = await readCodexCurrentContinuityV01(
      fixture.db,
      { generated_at: "2026-08-03T00:00:04.000Z" },
      dependenciesV01(fixture.config),
    );
    assert.equal(revised.status, "inserted");
    assert.equal(afterRevision.current_work.lineage_kind, "pre_execution_user_revision");
    assert.equal(afterRevision.current_work.goal, "Read the revised exact continuity");
    assert.equal(afterRevision.current_work.start_eligible, true);
    assert.notEqual(afterRevision.snapshot.binding, afterInitial.snapshot.binding);

    const stableReplay = await readCodexCurrentContinuityV01(
      fixture.db,
      { generated_at: "2026-08-03T01:00:00.000Z" },
      dependenciesV01(fixture.config),
    );
    assert.equal(stableReplay.snapshot.binding, afterRevision.snapshot.binding);

    fixture.db.prepare(
      `INSERT INTO autonomy_runs (
        run_id, scope, autonomy_contract_ref, title, status, created_at, updated_at,
        source_refs_json, authority_boundary_json, budget_snapshot_json,
        metadata_json
      ) VALUES (?, ?, 'direct_native_host_round_trip.v0.1', ?, 'running', ?, ?, '[]', '{}', '{}', ?)`,
    ).run(
      "autonomy-run:cdx2a-projection-only",
      fixture.project_id,
      "CDX2A projection-only run",
      "2026-08-03T00:00:05.000Z",
      "2026-08-03T00:00:05.000Z",
      JSON.stringify({
        lifecycle_mode: "managed_live",
        workspace_id: fixture.workspace_id,
        project_id: fixture.project_id,
        invocation_origin: "interactive",
        packet_id: revised.packet.packet_id,
        packet_fingerprint: revised.packet.integrity.fingerprint,
        control_revision: 1,
      }),
    );
    const beforeProjectionOnly = hashV01(fixture.db.serialize());
    const service = new LiveNativeHostRunServiceV01({
      open_database: () => new Database(fixture.config.database_path, {
        fileMustExist: true,
      }),
    });
    const projectionOnly = service.readProjectionOnlyV01(fixture.config);
    assert.equal(projectionOnly.status, "paused");
    assert.equal(projectionOnly.reconciliation_required, true);
    assert.equal(hashV01(fixture.db.serialize()), beforeProjectionOnly);
    assert.equal(
      (fixture.db.prepare("SELECT status FROM autonomy_runs WHERE run_id = ?").get(
        "autonomy-run:cdx2a-projection-only",
      ) as { status: string }).status,
      "running",
    );
    const afterRun = await readCodexCurrentContinuityV01(
      fixture.db,
      { generated_at: "2026-08-03T00:00:06.000Z" },
      { ...dependenciesV01(fixture.config), read_live_projection: () => projectionOnly },
    );
    assert.equal(afterRun.managed_execution.stage, "reconciliation_required");
    assert.equal(afterRun.current_work.start_eligible, false);
    assert.equal(afterRun.next_action.kind, "resume_or_reconcile_work");
    assert.notEqual(afterRun.snapshot.binding, afterRevision.snapshot.binding);

    const runMetadata = JSON.parse((fixture.db.prepare(
      "SELECT metadata_json FROM autonomy_runs WHERE run_id = ?",
    ).get("autonomy-run:cdx2a-projection-only") as { metadata_json: string }).metadata_json) as Record<string, unknown>;
    fixture.db.prepare(
      `UPDATE autonomy_runs
       SET status = 'needs_review', updated_at = ?, finished_at = ?, metadata_json = ?
       WHERE run_id = ?`,
    ).run(
      "2026-08-03T00:00:09.000Z",
      "2026-08-03T00:00:09.000Z",
      JSON.stringify({
        ...runMetadata,
        terminal_receipt_persisted: true,
        run_receipt_id: "run-receipt:missing-cdx2a",
        run_receipt_fingerprint: createCodexCurrentContinuitySnapshotBindingV01({ missing: "receipt" }),
      }),
      "autonomy-run:cdx2a-projection-only",
    );
    const missingReceipt = await readCodexCurrentContinuityV01(
      fixture.db,
      { generated_at: "2026-08-03T00:00:09.500Z" },
      dependenciesV01(fixture.config),
    );
    assert.equal(missingReceipt.latest_result.state, "result_unavailable");
    assert.equal(missingReceipt.latest_result.currentness, "unavailable_or_ambiguous");
    assert.equal(missingReceipt.managed_execution.result_available, false);
    assert.equal(missingReceipt.managed_execution.stage, "unavailable_or_inconsistent");
    assert.notEqual(missingReceipt.next_action.kind, "review_result");
    assert.notEqual(missingReceipt.source_status, "exact");
    assert.equal(missingReceipt.snapshot.status, "unavailable");
    assert.equal(exitCodeForProjection(missingReceipt), 3);

    const resultFixture: SemanticReviewLoopProjectFixtureV01 = {
      fixture_id: "cdx2a-current-result",
      workspace_id: fixture.workspace_id,
      project_id: fixture.project_id,
      run_id: "autonomy-run:cdx2a-projection-only",
    };
    const receipt = buildSemanticReviewLoopRunReceiptFixture(
      resultFixture,
      revised.packet,
      { timeline_anchor_at: "2026-08-03T00:00:10.000Z" },
    );
    insertVNextCoreRecordV01(fixture.db, {
      record_kind: "run_receipt",
      record_id: receipt.receipt_id,
      workspace_id: fixture.workspace_id,
      project_id: fixture.project_id,
      fingerprint: receipt.integrity.fingerprint,
      idempotency_key: receipt.idempotency_key,
      payload: receipt,
      created_at: receipt.recorded_at,
    });
    fixture.db.prepare(
      `UPDATE autonomy_runs
       SET status = 'needs_review', updated_at = ?, finished_at = ?, metadata_json = ?
       WHERE run_id = ?`,
    ).run(
      receipt.recorded_at,
      receipt.finished_at,
      JSON.stringify({
        ...runMetadata,
        terminal_receipt_persisted: true,
        run_receipt_id: receipt.receipt_id,
        run_receipt_fingerprint: receipt.integrity.fingerprint,
        host_outcome: receipt.result_summary.outcome,
      }),
      "autonomy-run:cdx2a-projection-only",
    );
    const directOverview = readProjectRunResultOverviewV01(fixture.db, {
      workspace_id: fixture.workspace_id,
      project_id: fixture.project_id,
    });
    assert.equal(directOverview.latest_result_state, "available");
    assert.equal(directOverview.latest_result?.receipt_ref, receipt.receipt_id);
    const directDetail = readProjectRunResultDetailV01(fixture.db, {
      workspace_id: fixture.workspace_id,
      project_id: fixture.project_id,
      receipt_id: receipt.receipt_id,
    });
    assert.equal(directDetail.identity.packet_ref?.external_id, revised.packet.packet_id);
    const resultProjection = await readCodexCurrentContinuityV01(
      fixture.db,
      { generated_at: "2026-08-03T00:00:11.000Z" },
      dependenciesV01(fixture.config),
    );
    assert.equal(resultProjection.managed_execution.stage, "terminal_result_ready");
    assert.equal(resultProjection.managed_execution.result_available, true);
    assert.equal(resultProjection.latest_result.state, "result_present");
    assert.equal(resultProjection.latest_result.currentness, "current");
    assert.equal(resultProjection.latest_result.artifacts.length > 0, true);
    assert.equal(resultProjection.latest_result.checks.length > 0, true);
    assert.equal(resultProjection.review_continuity.state, "no_proposal");
    assert.equal(resultProjection.next_action.kind, "review_result");
    assert.equal(resultProjection.authority.creates_review_decision, false);
    assert.equal(resultProjection.authority.creates_or_applies_transition, false);
    assert.notEqual(resultProjection.snapshot.binding, afterRun.snapshot.binding);
    const restartProjection = await loadCodexCurrentContinuityV01(
      { generated_at: "2026-08-03T00:00:12.000Z" },
      {
        open_database: () => new Database(fixture.config.database_path, {
          readonly: true,
          fileMustExist: true,
        }),
        ...dependenciesV01(fixture.config),
      },
    );
    assert.equal(restartProjection.snapshot.binding, resultProjection.snapshot.binding);

    selectActiveProjectV01(fixture.db, {
      workspace_id: fixture.workspace_id,
      project_id: other.project.project_id,
      expected_project_id: fixture.project_id,
      expected_revision:
        readActiveProjectSelectionV01(fixture.db, fixture.workspace_id)!.selection_revision,
      now: "2026-08-03T00:00:07.000Z",
    });
    const afterSwitch = await readCodexCurrentContinuityV01(
      fixture.db,
      { generated_at: "2026-08-03T00:00:08.000Z" },
      dependenciesV01({ ...fixture.config, project_id: other.project.project_id }),
    );
    assert.notEqual(afterSwitch.snapshot.binding, afterRevision.snapshot.binding);
    assert.equal(afterSwitch.project.display_name, "CDX2A secondary");
  } finally {
    fixture.db.close();
  }
}

function assertPureClassificationMatrixV01(): void {
  const stages: Array<[string, boolean, boolean, string]> = [
    ["queued", false, false, "preparing"],
    ["running", false, false, "running"],
    ["waiting_for_approval", false, false, "waiting_for_approval"],
    ["cancel_requested", false, false, "cancellation_requested"],
    ["running", true, false, "reconciliation_required"],
    ["completed", false, true, "terminal_result_ready"],
    ["blocked", false, false, "blocked"],
    ["failed", false, false, "failed"],
    ["cancelled", false, false, "cancelled"],
    ["timed_out", false, false, "timed_out"],
    ["malformed", false, false, "unavailable_or_inconsistent"],
  ];
  for (const [status, reconciliation, receipt, expected] of stages) {
    assert.equal(
      classifyCodexCurrentContinuityExecutionStageV01(status, reconciliation, receipt),
      expected,
    );
  }

  const currentPacket = { packet_id: "packet:current", packet_fingerprint: "sha256:current" };
  assert.equal(classifyCodexCurrentContinuityResultCurrentnessV01(currentPacket, currentPacket), "current");
  assert.equal(
    classifyCodexCurrentContinuityResultCurrentnessV01(
      { packet_id: "packet:historical", packet_fingerprint: "sha256:historical" },
      currentPacket,
    ),
    "stale",
  );
  assert.equal(classifyCodexCurrentContinuityResultCurrentnessV01(null, currentPacket), "unavailable_or_ambiguous");
  assert.equal(
    classifyCodexCurrentContinuityResultCurrentnessV01(
      { packet_id: "packet:current", packet_fingerprint: null },
      currentPacket,
    ),
    "unavailable_or_ambiguous",
  );

  const reviewCases = [
    ["needs_decision", "current", "proposal_present_decision_pending"],
    ["ready_to_complete", "current", "accepted_decision_awaiting_transition"],
    ["ready_to_complete", "stale", "transition_blocked"],
    ["project_updated", "current", "transition_applied"],
    ["rejected", "current", "decision_recorded"],
  ] as const;
  for (const [application, currentness, expected] of reviewCases) {
    assert.equal(classifyCodexCurrentContinuityReviewV01({
      application_status: application,
      decision_kind: application === "needs_decision" ? null : "accept",
      requested_project_change: application === "ready_to_complete",
      matching_transition_receipt_present: application === "project_updated",
      result_currentness: currentness,
    }).state, expected);
  }
  assert.equal(classifyCodexCurrentContinuityReviewV01({
    application_status: "continue_review",
    decision_kind: "accept",
    requested_project_change: true,
    matching_transition_receipt_present: false,
    result_currentness: "current",
  }).state, "accepted_decision_awaiting_transition");

  const baseProjection = assertCodexCurrentContinuityV01({
    projection_version: "codex_current_continuity.v0.1",
    generated_at: NOW,
    source_status: "exact",
    snapshot: {
      binding_version: "codex_current_continuity_snapshot.v0.1",
      algorithm: "sha256",
      status: "exact",
      binding: createCodexCurrentContinuitySnapshotBindingV01({ state: "test" }),
    },
    project: { status: "active_project", project_key: createCodexCurrentContinuitySnapshotBindingV01({ project: "fixture" }), display_name: "Fixture", active: true, selection_revision: 1, root_availability: "available" },
    current_work: { status: "current_work", goal: "Goal", success_criteria: ["Done"], non_goals: [], lineage_kind: "semantic_transition", currentness: "fresh", start_eligible: true, start_blocker: null, revision_eligible: false, revision_blocker: "Semantic work is not rewritten." },
    managed_execution: { stage: "no_run", mode: null, latest_checkpoint: null, blocker_or_attention: null, attention_required: false, reconciliation_required: false, result_available: false, updated_at: null },
    latest_result: { state: "no_result", currentness: "not_available", outcome: null, execution_status: null, verification_status: null, summary: null, recorded_at: null, artifacts: [], checks: [], skipped_checks: [], blockers: [], warnings: [], gaps: [], incomplete_historical_fields: [], review_attention: null, proposed_next_steps: [] },
    review_continuity: { state: "no_proposal", summary: "No proposal.", decision_kind: null, transition_currentness: "not_available" },
    next_action: { kind: "start_current_work", label: "Start current work", reason: "Read only.", user_action_required: true, executes: false },
    authority: allFalseAuthorityV01(),
    gaps: [],
  });
  assert.equal(baseProjection.current_work.lineage_kind, "semantic_transition");
  assert.equal(chooseCodexCurrentContinuityNextActionV01({
    project_status: baseProjection.project.status,
    work: baseProjection.current_work,
    execution: { ...baseProjection.managed_execution, stage: "waiting_for_approval" },
    result: baseProjection.latest_result,
    review: baseProjection.review_continuity,
    source_unavailable: false,
  }).kind, "review_host_approval");
}

function assertSnapshotMaterialMatrixV01(): void {
  const base = {
    workspace: "workspace:a",
    project: "project:a",
    selection_revision: 1,
    root: "available",
    packet: { id: "packet:a", fingerprint: "sha256:a", lineage: "initial_user_defined", currentness: "fresh" },
    run: null,
    result: null,
    review: null,
    current_work: {
      status: "current_work",
      lineage_kind: "initial_user_defined",
      currentness: "fresh",
      operator_configuration_available: true,
      start_eligible: true,
      start_blocker_code: null,
      revision_eligible: true,
      revision_reason: "current_initial_packet_zero_history",
    },
    next_action_kind: "start_current_work",
    source_status: "exact",
  };
  const first = createCodexCurrentContinuitySnapshotBindingV01(base);
  assert.equal(first, createCodexCurrentContinuitySnapshotBindingV01({ ...base }));
  for (const changed of [
    { ...base, project: "project:b" },
    { ...base, selection_revision: 2 },
    { ...base, root: "missing" },
    { ...base, packet: { ...base.packet, fingerprint: "sha256:b" } },
    { ...base, run: { id: "run:a", stage: "running" } },
    { ...base, run: { id: "run:a", stage: "failed" } },
    { ...base, result: { id: "receipt:a", fingerprint: "sha256:r" } },
    { ...base, review: { proposal: "proposal:a" } },
    { ...base, review: { decision: "decision:a" } },
    { ...base, review: { transition: "transition:a" } },
    { ...base, current_work: { ...base.current_work, operator_configuration_available: false } },
    { ...base, current_work: { ...base.current_work, start_eligible: false, start_blocker_code: "operator_configuration_unavailable" } },
    { ...base, current_work: { ...base.current_work, revision_eligible: false, revision_reason: "managed_run_history_present" } },
    { ...base, next_action_kind: "view_progress" },
    { ...base, source_status: "partial" },
  ]) {
    assert.notEqual(createCodexCurrentContinuitySnapshotBindingV01(changed), first);
  }
}

async function assertRouteAndCliAdaptersV01(): Promise<void> {
  assert.equal(CODEX_CURRENT_CONTINUITY_ACCESS_POLICY_V01.allowed_hosts.includes("localhost"), true);
  const headers = { "x-augnes-local-readonly": "codex-current-continuity-v0.1" };
  const valid = validateCodexCurrentContinuityReadRequestV01(new Request(
    "http://localhost/api/augnes/read/codex-current-continuity?scope=project%3Aaugnes",
    { headers },
  ));
  assert.equal(valid.ok, true);
  for (const [url, expected] of [
    ["http://localhost/api/augnes/read/codex-current-continuity", "missing_scope"],
    ["http://localhost/api/augnes/read/codex-current-continuity?scope=wrong", "invalid_scope"],
    ["http://localhost/api/augnes/read/codex-current-continuity?scope=project%3Aaugnes&extra=1", "unknown_query_key"],
    ["http://localhost/api/augnes/read/codex-current-continuity?scope=project%3Aaugnes&scope=project%3Aaugnes", "duplicate_query_key"],
  ] as const) {
    const checked = validateCodexCurrentContinuityReadRequestV01(new Request(url, { headers }));
    assert.equal(checked.ok, false);
    if (!checked.ok) assert.equal(checked.code, expected);
  }
  assert.equal(validateCodexCurrentContinuityReadRequestV01(new Request(
    "http://example.com/api/augnes/read/codex-current-continuity?scope=project%3Aaugnes",
    { headers },
  )).ok, false);
  assert.equal(validateCodexCurrentContinuityReadRequestV01(new Request(
    "http://localhost/api/augnes/read/codex-current-continuity?scope=project%3Aaugnes",
    { method: "POST", headers },
  )).ok, false);

  const dbPath = path.join(ROOT, "route.db");
  const db = createDatabaseV01(dbPath);
  db.close();
  process.env.AUGNES_DB_PATH = dbPath;
  const before = hashV01(readFileSync(dbPath));
  const response = await continuityGET(new Request(
    "http://localhost/api/augnes/read/codex-current-continuity?scope=project%3Aaugnes",
    { headers },
  ));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-augnes-local-readonly"), "codex-current-continuity-v0.1");
  const routeProjection = await response.clone().json();
  assert.equal(hashV01(readFileSync(dbPath)), before);

  const cliProjection = await fetchCurrentContinuity("http://127.0.0.1:3000", async (request, init) => {
    assert.equal(init?.method, "GET");
    assert.equal(new Headers(init?.headers).get("x-augnes-local-readonly"), "codex-current-continuity-v0.1");
    return new Response(JSON.stringify(routeProjection), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-augnes-local-readonly": "codex-current-continuity-v0.1",
        "cache-control": "no-store",
      },
    });
  });
  assert.deepEqual(cliProjection, routeProjection);
  assert.match(formatHumanSummary(cliProjection), /authority: read-only/u);
  assert.match(formatMachineResult(cliProjection), /BEGIN_AUGNES_CODEX_CURRENT_CONTINUITY_JSON/u);
  assert.equal(buildCurrentContinuityUrl("http://localhost:3000").searchParams.get("scope"), "project:augnes");
  assert.equal(resolveConfig({ NODE_ENV: "test" }).apiBaseUrl, "http://localhost:3000");
  assert.throws(() => resolveConfig({ NODE_ENV: "test", AUGNES_API_BASE_URL: "https://example.com" }), /LOCAL_RUNTIME_REQUIRED/u);
  const transportError = await fetchCurrentContinuity("http://localhost:3000", async () => {
    throw new Error("network unavailable");
  }).then(() => null, (error: unknown) => error);
  assert.equal(exitCodeForError(transportError), 2);
  for (const response of [
    new Response(JSON.stringify(routeProjection), { status: 200 }),
    new Response("{}", {
      status: 200,
      headers: { "x-augnes-local-readonly": "codex-current-continuity-v0.1" },
    }),
    new Response("{}", { status: 500 }),
  ]) {
    const error = await fetchCurrentContinuity(
      "http://localhost:3000",
      async () => response,
    ).then(() => null, (value: unknown) => value);
    assert.equal(exitCodeForError(error), 3);
  }
  assert.equal(exitCodeForProjection(cliProjection), 0);
  for (const projection of [
    { ...cliProjection, source_status: "partial" as const, snapshot: { ...cliProjection.snapshot, status: "unavailable" as const, binding: null } },
    { ...cliProjection, source_status: "unavailable" as const, snapshot: { ...cliProjection.snapshot, status: "unavailable" as const, binding: null } },
    { ...cliProjection, snapshot: { ...cliProjection.snapshot, status: "unavailable" as const, binding: null } },
  ]) {
    assert.equal(exitCodeForProjection(projection), 3);
  }
  assert.equal(JSON.stringify(routeProjection).includes(dbPath), false);
}

interface FixtureV01 {
  db: Database.Database;
  root: string;
  workspace_id: string;
  project_id: string;
  config: VNextLocalOperatorPilotConfigV01;
}

function createFixtureV01(name: string, uuid: string): FixtureV01 {
  const db = createDatabaseV01(path.join(ROOT, `${name}.db`));
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db, {
    create_uuid: () => "20000000-0000-4000-8000-000000000001",
    now: () => NOW,
  });
  const root = path.join(ROOT, name);
  mkdirSync(root, { recursive: true });
  writeFileSync(path.join(root, "README.md"), "# disposable CDX2A fixture\n", "utf8");
  const registration = registerProjectV01(db, workspace.workspace_id, root, "CDX2A primary", uuid);
  selectActiveProjectV01(db, {
    workspace_id: workspace.workspace_id,
    project_id: registration.project.project_id,
    expected_project_id: null,
    expected_revision: null,
    now: NOW,
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
      operator_id: `operator:cdx2a:${name}`,
      database_path: path.join(ROOT, `${name}.db`),
    },
  };
}

function registerProjectV01(
  db: Database.Database,
  workspaceId: string,
  root: string,
  displayName: string,
  uuid: string,
) {
  mkdirSync(root, { recursive: true });
  return getOrCreateCanonicalProjectForLocalRootV01(db, {
    workspace_id: workspaceId,
    local_root: normalizeLocalProjectRootRefV01(root, { base_path: ROOT }),
    display_name: displayName,
  }, { create_uuid: () => uuid, now: () => NOW });
}

function createDatabaseV01(databasePath: string): Database.Database {
  const db = new Database(databasePath);
  db.pragma("foreign_keys = ON");
  applyCanonicalDatabaseMigrations(db);
  return db;
}

function insertManagedRunV01(
  db: Database.Database,
  projectId: string,
  runId: string,
  metadata: Record<string, unknown>,
  status = "running",
): void {
  db.prepare(
    `INSERT INTO autonomy_runs (
      run_id, scope, autonomy_contract_ref, title, status, created_at, updated_at,
      source_refs_json, authority_boundary_json, budget_snapshot_json,
      metadata_json
    ) VALUES (?, ?, 'direct_native_host_round_trip.v0.1', ?, ?, ?, ?, '[]', '{}', '{}', ?)`,
  ).run(
    runId,
    projectId,
    `CDX2A ${runId}`,
    status,
    "2026-08-03T02:00:00.000Z",
    "2026-08-03T02:00:00.000Z",
    JSON.stringify(metadata),
  );
}

function updateManagedRunMetadataV01(
  db: Database.Database,
  runId: string,
  metadata: Record<string, unknown>,
): void {
  db.prepare(
    "UPDATE autonomy_runs SET metadata_json = ?, updated_at = ? WHERE run_id = ?",
  ).run(
    JSON.stringify(metadata),
    "2026-08-03T02:00:01.000Z",
    runId,
  );
}

function dependenciesV01(config: VNextLocalOperatorPilotConfigV01) {
  return {
    read_root_availability: async () => "available" as const,
    read_operator_config: () => config,
    read_live_projection: () => idleLiveProjectionV01(),
  };
}

function idleLiveProjectionV01(): LiveNativeHostRunProjectionV01 {
  return {
    service_version: "live_native_host_run_service.v0.1",
    status: "idle",
    run_ref: null,
    mode: null,
    control_revision: 0,
    reconciliation_required: false,
    public_reason: null,
    capability: { status: "not_checked", adapter_version: null, capability_version: null, cli_version: null, public_reason: null },
    pending_approval: null,
    receipt: null,
    packet_copy_actions: 0,
    handoff_paste_actions: 0,
    result_paste_actions: 0,
    internal_id_entry_actions: 0,
    semantic_authority_granted: false,
  };
}

function authenticatedSessionV01(
  fixture: FixtureV01,
  suffix: string,
): VNextLocalOperatorSessionCredentialV01 {
  fixture.config.operator_id = `operator:cdx2a:${suffix}`;
  const issue = issueVNextLocalOperatorBootstrapV01(fixture.db, {
    config: fixture.config,
    clock: fixedClockV01(NOW),
  });
  return consumeVNextLocalOperatorBootstrapV01(fixture.db, {
    config: fixture.config,
    bootstrap_token: issue.bootstrap_token,
    clock: fixedClockV01(LATER),
  }).credential;
}

function authenticatedSessionAtV01(
  fixture: FixtureV01,
  suffix: string,
  issuedAt: string,
  consumedAt: string,
): VNextLocalOperatorSessionCredentialV01 {
  fixture.config.operator_id = `operator:cdx2a:${suffix}`;
  const issue = issueVNextLocalOperatorBootstrapV01(fixture.db, {
    config: fixture.config,
    clock: fixedClockV01(issuedAt),
  });
  return consumeVNextLocalOperatorBootstrapV01(fixture.db, {
    config: fixture.config,
    bootstrap_token: issue.bootstrap_token,
    clock: fixedClockV01(consumedAt),
  }).credential;
}

function authenticatedSessionForCurrentOperatorAtV01(
  fixture: FixtureV01,
  issuedAt: string,
  consumedAt: string,
): VNextLocalOperatorSessionCredentialV01 {
  const issue = issueVNextLocalOperatorBootstrapV01(fixture.db, {
    config: fixture.config,
    clock: fixedClockV01(issuedAt),
  });
  return consumeVNextLocalOperatorBootstrapV01(fixture.db, {
    config: fixture.config,
    bootstrap_token: issue.bootstrap_token,
    clock: fixedClockV01(consumedAt),
  }).credential;
}

function revisionRequestV01(fixture: FixtureV01, packet: TaskContextPacketV01) {
  return {
    action: "revise_pre_execution_project_work" as const,
    workspace_id: fixture.workspace_id,
    project_id: fixture.project_id,
    expected_active_project_id: fixture.project_id,
    expected_active_selection_revision:
      readActiveProjectSelectionV01(fixture.db, fixture.workspace_id)!.selection_revision,
    expected_current_packet_id: packet.packet_id,
    expected_current_packet_fingerprint: packet.integrity.fingerprint,
    expected_current_lineage_kind: "initial_user_defined" as const,
    goal: "Read the revised exact continuity",
    success_criteria: ["Current work remains exact", "The revision is append-only"],
    non_goals: ["Do not start Codex"],
  };
}

function fixedClockV01(now: string) {
  return { now: () => now };
}

function sequenceClockV01(...values: string[]) {
  let index = 0;
  return {
    now: () => values[Math.min(index++, values.length - 1)]!,
  };
}

function hashV01(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function allFalseAuthorityV01() {
  return {
    writes_database: false as const,
    writes_project_files: false as const,
    changes_project_selection: false as const,
    changes_operator_session: false as const,
    creates_run: false as const,
    starts_codex_or_native_host: false as const,
    calls_provider: false as const,
    approves_host_action: false as const,
    cancels_or_resumes_run: false as const,
    creates_or_admits_result: false as const,
    creates_proof_or_evidence: false as const,
    creates_proposal: false as const,
    creates_review_decision: false as const,
    creates_or_applies_transition: false as const,
    mutates_accepted_state: false as const,
    retries_or_replays: false as const,
    calls_github: false as const,
    creates_branch_or_pr: false as const,
    merges_releases_or_deploys: false as const,
    starts_background_work: false as const,
  };
}
