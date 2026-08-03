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
  fetchCurrentContinuity,
  formatHumanSummary,
  formatMachineResult,
  resolveConfig,
} from "../apps/augnes_apps/scripts/codex-current-continuity";
import {
  buildSemanticReviewLoopRunReceiptFixture,
  type SemanticReviewLoopProjectFixtureV01,
} from "../fixtures/vnext/protocol/semantic-review-loop-v0-1";
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
  consumeVNextLocalOperatorBootstrapV01,
  issueVNextLocalOperatorBootstrapV01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSessionCredentialV01,
} from "../lib/vnext/runtime/local-operator-session";
import {
  defineInitialProjectWorkV01,
} from "../lib/vnext/runtime/project-work-initialization";
import { revisePreExecutionProjectWorkV01 } from "../lib/vnext/runtime/project-work-revision";
import {
  readProjectRunResultDetailV01,
  readProjectRunResultOverviewV01,
} from "../lib/vnext/runtime/project-run-result-read-model";
import {
  LiveNativeHostRunServiceV01,
  type LiveNativeHostRunProjectionV01,
} from "../lib/vnext/runtime/live-native-host-run-service";
import type { TaskContextPacketV01 } from "../types/vnext/task-context-packet";
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

async function assertExactOwnerStatesV01(): Promise<void> {
  const emptyDb = createDatabaseV01(path.join(ROOT, "empty.db"));
  try {
    const first = await readCodexCurrentContinuityV01(emptyDb, { generated_at: NOW });
    const second = await readCodexCurrentContinuityV01(emptyDb, { generated_at: LATER });
    assert.equal(first.project.status, "no_workspace");
    assert.equal(first.next_action.kind, "choose_project");
    assert.equal(first.snapshot.binding, second.snapshot.binding);
    assert.notEqual(first.generated_at, second.generated_at);
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
    assert.equal(missingReceipt.snapshot.status, "unavailable");

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
  }).state, "transition_blocked");

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
