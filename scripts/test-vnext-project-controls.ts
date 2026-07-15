#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import { GET as controlsGET, POST as controlsPOST } from "../app/api/vnext/project-controls/route";
import {
  DURABLE_LOCAL_LOOP_APPLIED_AT,
  DURABLE_LOCAL_LOOP_CONFIRMED_AT,
  DURABLE_LOCAL_LOOP_CURRENT_STATE_OBSERVED_AT,
  DURABLE_LOCAL_LOOP_ELIGIBILITY_EVALUATED_AT,
  DURABLE_LOCAL_LOOP_GATE_EVALUATED_AT,
  DURABLE_LOCAL_LOOP_GATE_EXPIRES_AT,
  DURABLE_LOCAL_LOOP_LATER_PACKET_GENERATED_AT,
  DURABLE_LOCAL_LOOP_PREVIEWED_AT,
  DURABLE_LOCAL_LOOP_RECORDED_AT,
} from "../fixtures/vnext/runtime/durable-local-closed-loop-v0-1";
import {
  createSemanticTransitionDecisionInputV01,
} from "../fixtures/vnext/protocol/semantic-transition-loop-v0-1";
import {
  buildSemanticReviewLoopTaskContextPacketFixture,
  semanticReviewLoopMapperInputFixture,
  type SemanticReviewLoopProjectFixtureV01,
} from "../fixtures/vnext/protocol/semantic-review-loop-v0-1";
import { openDatabase } from "../lib/db";
import { mapCodexSemanticReviewToEpisodeDeltaProposalV01 } from "../lib/vnext/compat/episode-delta-proposal-from-codex-review";
import {
  buildConservativeProjectAutomationPolicyV01,
  evaluateProjectAutomationAdmissionV01,
  selectPersonalPerspectiveContextV01,
  validateProjectAutomationPolicyV01,
} from "../lib/vnext/project-controls/project-controls";
import {
  ProjectControlStoreErrorV01,
  VNEXT_PROJECT_CONTROL_SCHEMA_SQL_V01,
  mutateProjectControlV01,
  readPersonalPerspectiveEffectiveScopeV01,
  readProjectAutomationEffectiveStatusV01,
} from "../lib/vnext/persistence/project-control-store";
import {
  attachProjectExternalRefV01,
  getOrCreateCanonicalProjectForLocalRootV01,
  getOrCreateDefaultWorkspaceIdentityV01,
  normalizeLocalProjectRootRefV01,
  rebindCanonicalProjectLocalRootV01,
} from "../lib/vnext/persistence/project-identity-registry";
import {
  readActiveProjectSelectionV01,
  removeRecentProjectV01,
  selectActiveProjectV01,
  touchRecentProjectV01,
} from "../lib/vnext/persistence/project-lifecycle-registry";
import {
  readProjectHomeProjectionV01,
} from "../lib/vnext/project-home/project-home-projection";
import { buildReviewDecisionV01 } from "../lib/vnext/review-decision";
import {
  commitVNextSemanticTransitionV01,
  persistVNextSemanticReviewMaterialV01,
  prepareVNextSemanticCommitPreviewV01,
  recordVNextSemanticCommitAuthorizationV01,
} from "../lib/vnext/runtime/durable-semantic-transition";
import {
  compileTaskContextPacketFromPersistedSemanticStateV01,
} from "../lib/vnext/runtime/persisted-semantic-context-compiler";
import { buildTaskContextPacketV01 } from "../lib/vnext/task-context-packet";
import type {
  PersonalPerspectiveContextCandidateV01,
  ProjectAutomationEffectiveStatusV01,
} from "../types/vnext/project-controls";
import type { TaskContextPacketV01 } from "../types/vnext/task-context-packet";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { vNextProjectControlSchemaSqlV01 } from "./db-migrations.mjs";

const root = mkdtempSync(path.join(tmpdir(), "augnes-project-controls-"));
const dbPath = path.join(root, "controls.db");
const projectARoot = path.join(root, "Project A");
const projectBRoot = path.join(root, "Project B");
const recoveredARoot = path.join(root, "Project A recovered");
const sharedRepository = "https://example.test/shared/project-controls.git";
const originalEnvironment = { ...process.env };

for (const key of [
  "OPENAI_API_KEY",
  "GITHUB_TOKEN",
  "GH_TOKEN",
  "CODEX_HOME",
  "MCP_CONFIG",
  "SCHEDULER_CONFIG",
]) {
  delete process.env[key];
}
process.env.AUGNES_DB_PATH = dbPath;
process.env.AUGNES_CANONICAL_TEST_MODE = "1";
process.env.AUGNES_CANONICAL_TEMP_ROOT = root;

let db: Database.Database | null = null;

function fixedClock(...values: string[]) {
  let index = 0;
  return {
    now() {
      const value = values[Math.min(index, values.length - 1)]!;
      if (index < values.length - 1) index += 1;
      return value;
    },
  };
}

function tableCount(database: Database.Database, table: string): number {
  return Number(
    (database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as {
      count: number;
    }).count,
  );
}

function mutationSideEffectCounts(database: Database.Database) {
  return {
    core_records: tableCount(database, "vnext_core_records"),
    semantic_state: tableCount(database, "vnext_semantic_state_entries"),
    grants: tableCount(database, "autonomy_delegation_grants"),
    automation_controls: tableCount(
      database,
      "vnext_project_automation_controls",
    ),
    perspective_scopes: tableCount(
      database,
      "vnext_project_personal_perspective_scopes",
    ),
  };
}

function registerProject(
  database: Database.Database,
  workspaceId: string,
  projectRoot: string,
  displayName: string,
  uuid: string,
) {
  const registration = getOrCreateCanonicalProjectForLocalRootV01(
    database,
    {
      workspace_id: workspaceId,
      local_root: normalizeLocalProjectRootRefV01(projectRoot, {
        base_path: root,
      }),
      display_name: displayName,
    },
    {
      create_uuid: () => uuid,
      now: () => "2026-07-09T20:00:00.000Z",
    },
  );
  attachProjectExternalRefV01(
    database,
    {
      workspace_id: workspaceId,
      project_id: registration.project.project_id,
      external_ref: {
        ref_version: "external_ref.v0.1",
        ref_type: "repository_remote",
        external_id: sharedRepository,
        provider: "git",
        host: "example.test",
        observed_at: "2026-07-09T20:00:00.000Z",
        trust_class: "direct_local_observation",
      },
    },
    { now: () => "2026-07-09T20:00:00.000Z" },
  );
  return registration;
}

function expectStoreError(
  operation: () => unknown,
  code: ProjectControlStoreErrorV01["code"],
) {
  assert.throws(operation, (error: unknown) => {
    assert(error instanceof ProjectControlStoreErrorV01);
    assert.equal(error.code, code);
    return true;
  });
}

function admission(
  control: ProjectAutomationEffectiveStatusV01,
  overrides: {
    candidateProjectId?: string;
    grantProjectId?: string;
    grantStatus?: "ready" | "required" | "capability_unavailable" | "policy_denied" | "unsupported";
    activeRunCount?: number;
  } = {},
) {
  return evaluateProjectAutomationAdmissionV01({
    workspace_id: control.workspace_id,
    project_id: control.project_id,
    control,
    candidate: {
      workspace_id: control.workspace_id,
      project_id: overrides.candidateProjectId ?? control.project_id,
    },
    grant_readiness: {
      workspace_id: control.workspace_id,
      project_id: overrides.grantProjectId ?? control.project_id,
      status: overrides.grantStatus ?? "required",
    },
    active_run_readiness: {
      workspace_id: control.workspace_id,
      project_id: control.project_id,
      active_automated_run_count: overrides.activeRunCount ?? 0,
    },
  });
}

function makeCandidate(
  workspaceId: string,
  projectId: string,
  suffix: string,
  overrides: Partial<PersonalPerspectiveContextCandidateV01> = {},
): PersonalPerspectiveContextCandidateV01 {
  const ref = {
    ref_version: "external_ref.v0.1" as const,
    ref_type: "reviewed_memory",
    external_id: `memory:${suffix}`,
    observed_at: "2026-07-09T22:00:00.000Z",
    trust_class: "direct_local_observation" as const,
  };
  return {
    candidate_scope: {
      scope_kind: "canonical_project",
      workspace_id: workspaceId,
      project_id: projectId,
    },
    review_status: "reviewed",
    trust_policy_status: "eligible",
    entry: {
      entry_id: `personal-perspective:${suffix}`,
      entry_kind: "memory_ref",
      source_ref: `memory-source:${suffix}`,
      external_ref: ref,
      why_included: "Eligible reviewed Personal Perspective fixture.",
      currentness: {
        status: "fresh",
        as_of: "2026-07-09T22:00:00.000Z",
        basis: "Reviewed local fixture.",
        source_ref: ref,
      },
      trust_class: "direct_local_observation",
      compatibility_source_ref: ref,
      bounded_summary: `Private fixture ${suffix}`,
    },
    ...overrides,
  };
}

function rebuildPriorPacketWithPersonalPerspective(
  base: TaskContextPacketV01,
  selected: PersonalPerspectiveContextCandidateV01["entry"][],
): TaskContextPacketV01 {
  return buildTaskContextPacketV01({
    workspace_id: base.workspace_id,
    project_id: base.project_id,
    work_ref: base.work_ref,
    generated_at: base.generated_at,
    expires_at: base.expires_at,
    task: base.task,
    current_projection: base.current_projection,
    selected_context: [...base.selected_context, ...selected],
    excluded_context: base.excluded_context,
    tensions: base.tensions,
    risks: base.risks,
    gaps: base.gaps,
    constraints: base.constraints,
    capability_grant: base.capability_grant,
    return_contract: base.return_contract,
    source_status: base.source_status,
    compatibility: base.compatibility,
    authority_notes: base.authority_summary.notes,
  });
}

function compileIncludedPersonalPerspective(
  database: Database.Database,
  workspaceId: string,
  projectId: string,
  candidate: PersonalPerspectiveContextCandidateV01,
) {
  const scope = readPersonalPerspectiveEffectiveScopeV01(database, {
    workspace_id: workspaceId,
    project_id: projectId,
  });
  const gated = selectPersonalPerspectiveContextV01({
    workspace_id: workspaceId,
    project_id: projectId,
    scope,
    candidates: [candidate],
  });
  assert.equal(gated.eligible_selected_count, 1);
  const project: SemanticReviewLoopProjectFixtureV01 = {
    fixture_id: "canonical-project-controls-a",
    workspace_id: workspaceId,
    project_id: projectId,
    run_id: "run:project-controls-context",
  };
  const priorPacket = rebuildPriorPacketWithPersonalPerspective(
    buildSemanticReviewLoopTaskContextPacketFixture(project),
    gated.selected_context,
  );
  const mapped = mapCodexSemanticReviewToEpisodeDeltaProposalV01(
    semanticReviewLoopMapperInputFixture(project, priorPacket),
  );
  assert.equal(mapped.status, "mapped");
  assert(mapped.proposal);
  const decision = buildReviewDecisionV01(
    createSemanticTransitionDecisionInputV01(project, mapped.proposal),
  );
  persistVNextSemanticReviewMaterialV01(database, {
    proposal: mapped.proposal,
    decision,
  });
  const preview = prepareVNextSemanticCommitPreviewV01(database, {
    workspace_id: workspaceId,
    project_id: projectId,
    proposal_id: mapped.proposal.proposal_id,
    proposal_fingerprint: mapped.proposal.integrity.fingerprint,
    decision_id: decision.decision_id,
    decision_fingerprint: decision.integrity.fingerprint,
    authorized_applier_identity: {
      ref_type: "semantic_transition_applier",
      external_id: "local-project-controls-test",
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
  const transition = commitVNextSemanticTransitionV01(database, {
    workspace_id: workspaceId,
    project_id: projectId,
    proposal_id: mapped.proposal.proposal_id,
    proposal_fingerprint: mapped.proposal.integrity.fingerprint,
    decision_id: decision.decision_id,
    decision_fingerprint: decision.integrity.fingerprint,
    gate_record_id: authorization.gate_record.gate_record_id,
    gate_record_fingerprint: authorization.gate_record.integrity.fingerprint,
    clock: fixedClock(
      DURABLE_LOCAL_LOOP_APPLIED_AT,
      DURABLE_LOCAL_LOOP_RECORDED_AT,
    ),
  });
  assert.equal(transition.status, "applied");
  const compiled = compileTaskContextPacketFromPersistedSemanticStateV01(
    database,
    {
      workspace_id: workspaceId,
      project_id: projectId,
      prior_packet: priorPacket,
      transition_receipt_id: transition.receipt.transition_receipt_id,
      transition_receipt_fingerprint: transition.receipt.integrity.fingerprint,
      expiry_policy: { mode: "reuse_prior" },
      personal_perspective_candidates: [candidate],
      clock: fixedClock(DURABLE_LOCAL_LOOP_LATER_PACKET_GENERATED_AT),
    },
  );
  assert.equal(compiled.full_chain_relation.status, "valid");
  assert.equal(compiled.personal_perspective_selection.eligible_selected_count, 1);
  assert.equal(
    compiled.later_packet.selected_context.filter(
      (entry) =>
        entry.compatibility_source_ref?.ref_type ===
        "project_personal_perspective_scope",
    ).length,
    1,
  );
  assert(
    compiled.later_packet.compatibility.source_refs.some(
      (ref) => ref.ref_type === "project_personal_perspective_scope",
    ),
  );
  assert.equal(
    JSON.stringify(compiled.later_packet).includes("policy_json"),
    false,
  );
  return compiled;
}

function routeRequest(body: Record<string, unknown>, options: {
  origin?: string;
  url?: string;
  host?: string;
} = {}) {
  return new Request(
    options.url ?? "http://127.0.0.1:3100/api/vnext/project-controls",
    {
      method: "POST",
      headers: {
        host: options.host ?? "127.0.0.1:3100",
        origin: options.origin ?? "http://127.0.0.1:3100",
        "content-type": "application/json",
        "sec-fetch-site": "same-origin",
      },
      body: JSON.stringify(body),
    },
  );
}

async function routeMutation(body: Record<string, unknown>, options = {}) {
  const response = await controlsPOST(routeRequest(body, options));
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
}

function normalizedTableShape(database: Database.Database, table: string) {
  return {
    columns: database.prepare(`PRAGMA table_info(${table})`).all(),
    foreign_keys: database.prepare(`PRAGMA foreign_key_list(${table})`).all(),
  };
}

function migrationParity() {
  const runtime = new Database(":memory:");
  const migration = new Database(":memory:");
  try {
    applyCanonicalDatabaseMigrations(runtime);
    applyCanonicalDatabaseMigrations(runtime);
    migration.pragma("foreign_keys = ON");
    applyCanonicalDatabaseMigrations(migration);
    migration.exec(vNextProjectControlSchemaSqlV01);
    for (const table of [
      "vnext_project_automation_controls",
      "vnext_project_personal_perspective_scopes",
    ]) {
      assert.deepEqual(
        normalizedTableShape(runtime, table),
        normalizedTableShape(migration, table),
      );
    }
    const direct = new Database(":memory:");
    try {
      applyCanonicalDatabaseMigrations(direct);
      direct.exec(VNEXT_PROJECT_CONTROL_SCHEMA_SQL_V01);
      assert.equal(direct.pragma("integrity_check", { simple: true }), "ok");
    } finally {
      direct.close();
    }
  } finally {
    runtime.close();
    migration.close();
  }
}

async function main() {
  try {
    mkdirSync(projectARoot);
    mkdirSync(projectBRoot);
    mkdirSync(recoveredARoot);
    migrationParity();
    db = openDatabase();
    applyCanonicalDatabaseMigrations(db);
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(db, {
      create_uuid: () => "00000000-0000-4000-8000-000000000001",
      now: () => "2026-07-09T20:00:00.000Z",
    });
    const projectA = registerProject(
      db,
      workspace.workspace_id,
      projectARoot,
      "Project A",
      "00000000-0000-4000-8000-000000000002",
    );
    const projectB = registerProject(
      db,
      workspace.workspace_id,
      projectBRoot,
      "Project B",
      "00000000-0000-4000-8000-000000000003",
    );
    touchRecentProjectV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: projectA.project.project_id,
      now: "2026-07-09T20:10:00.000Z",
    });
    touchRecentProjectV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: projectB.project.project_id,
      now: "2026-07-09T20:11:00.000Z",
    });
    let active = selectActiveProjectV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: projectA.project.project_id,
      expected_project_id: null,
      expected_revision: null,
      now: "2026-07-09T20:12:00.000Z",
    });

    const rowsBeforeReads = mutationSideEffectCounts(db);
    const automationDefault = readProjectAutomationEffectiveStatusV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: projectA.project.project_id,
    });
    const perspectiveDefault = readPersonalPerspectiveEffectiveScopeV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: projectA.project.project_id,
    });
    assert.equal(automationDefault.status, "not_configured");
    assert.equal(admission(automationDefault).status, "not_configured");
    assert.equal(perspectiveDefault.status, "not_configured");
    assert.equal(perspectiveDefault.effectively_included, false);
    const defaultHome = await readProjectHomeProjectionV01(
      db,
      {
        workspace_id: workspace.workspace_id,
        project_id: projectA.project.project_id,
      },
      {
        now: () => "2026-07-09T20:13:00.000Z",
        read_root_availability: async () => "available",
      },
    );
    assert.equal(defaultHome.automation.status, "not_configured");
    assert.equal(defaultHome.personal_perspective.status, "not_configured");
    assert.deepEqual(mutationSideEffectCounts(db), rowsBeforeReads);

    const beforePerspectiveMutation = mutationSideEffectCounts(db);
    const include = mutateProjectControlV01(
      db,
      {
        workspace_id: workspace.workspace_id,
        project_id: projectA.project.project_id,
        action: "include_personal_perspective",
        expected_active_project_id: projectA.project.project_id,
        expected_active_selection_revision: active.selection_revision,
        expected_control_revision: null,
      },
      { now: () => "2026-07-09T21:00:00.000Z" },
    );
    assert.equal(include.personal_perspective?.status, "included");
    assert.equal(include.personal_perspective?.scope_revision, 1);
    const afterPerspectiveMutation = mutationSideEffectCounts(db);
    assert.equal(
      afterPerspectiveMutation.core_records,
      beforePerspectiveMutation.core_records,
    );
    assert.equal(
      afterPerspectiveMutation.semantic_state,
      beforePerspectiveMutation.semantic_state,
    );
    assert.equal(afterPerspectiveMutation.grants, beforePerspectiveMutation.grants);

    const candidateA = makeCandidate(
      workspace.workspace_id,
      projectA.project.project_id,
      "project-a",
    );
    const candidateB = makeCandidate(
      workspace.workspace_id,
      projectB.project.project_id,
      "project-b-secret",
    );
    const unreviewed = makeCandidate(
      workspace.workspace_id,
      projectA.project.project_id,
      "unreviewed",
      { review_status: "unreviewed" },
    );
    const stale = makeCandidate(
      workspace.workspace_id,
      projectA.project.project_id,
      "stale",
      {
        entry: {
          ...candidateA.entry,
          entry_id: "personal-perspective:stale",
          currentness: {
            ...candidateA.entry.currentness,
            status: "stale",
          },
        },
      },
    );
    const untrusted = makeCandidate(
      workspace.workspace_id,
      projectA.project.project_id,
      "untrusted",
      { trust_policy_status: "ineligible" },
    );
    const globalLegacy = makeCandidate(
      workspace.workspace_id,
      projectA.project.project_id,
      "legacy-global",
      { candidate_scope: { scope_kind: "legacy_global" } },
    );
    const gate = selectPersonalPerspectiveContextV01({
      workspace_id: workspace.workspace_id,
      project_id: projectA.project.project_id,
      scope: include.personal_perspective!,
      candidates: [
        candidateA,
        candidateB,
        unreviewed,
        stale,
        untrusted,
        globalLegacy,
      ],
    });
    assert.equal(gate.selected_context.length, 1);
    assert.equal(gate.excluded_context.length, 5);
    assert(gate.selected_context[0]?.why_included.includes("project explicitly permits"));
    assert(gate.excluded_context.every((entry) => entry.why_excluded.length > 0));
    const budgetCandidates = Array.from({ length: 6 }, (_, index) =>
      makeCandidate(
        workspace.workspace_id,
        projectA.project.project_id,
        `budget-${index}`,
      ),
    );
    const budgetSelection = selectPersonalPerspectiveContextV01({
      workspace_id: workspace.workspace_id,
      project_id: projectA.project.project_id,
      scope: include.personal_perspective!,
      candidates: budgetCandidates,
    });
    const budgetBase = buildSemanticReviewLoopTaskContextPacketFixture({
      fixture_id: "project-controls-budget",
      workspace_id: workspace.workspace_id,
      project_id: projectA.project.project_id,
      run_id: "run:project-controls-budget",
    });
    const budgetPacket = buildTaskContextPacketV01({
      workspace_id: budgetBase.workspace_id,
      project_id: budgetBase.project_id,
      work_ref: budgetBase.work_ref,
      generated_at: budgetBase.generated_at,
      expires_at: budgetBase.expires_at,
      task: budgetBase.task,
      current_projection: budgetBase.current_projection,
      selected_context: budgetSelection.selected_context,
      excluded_context: budgetSelection.excluded_context,
      tensions: budgetBase.tensions,
      risks: budgetBase.risks,
      gaps: budgetBase.gaps,
      constraints: {
        ...budgetBase.constraints,
        context_budget: {
          ...budgetBase.constraints.context_budget,
          max_selected_entries: 1,
        },
      },
      capability_grant: budgetBase.capability_grant,
      return_contract: budgetBase.return_contract,
      source_status: budgetBase.source_status,
      compatibility: budgetBase.compatibility,
      authority_notes: budgetBase.authority_summary.notes,
    });
    assert.equal(budgetPacket.selected_context.length, 1);
    assert.equal(
      budgetPacket.excluded_context.filter((entry) =>
        entry.why_excluded.includes("selected-context budget"),
      ).length,
      5,
    );
    const compiled = compileIncludedPersonalPerspective(
      db,
      workspace.workspace_id,
      projectA.project.project_id,
      candidateA,
    );
    assert.equal(
      JSON.stringify(compiled.later_packet).includes("project-b-secret"),
      false,
    );

    const beforeAutomationMutation = mutationSideEffectCounts(db);
    const routeEnable = await routeMutation({
      action: "enable_automation",
      project_id: projectA.project.project_id,
      expected_active_project_id: projectA.project.project_id,
      expected_active_selection_revision: active.selection_revision,
      expected_control_revision: null,
    });
    assert.equal(routeEnable.status, 200);
    const afterAutomationMutation = mutationSideEffectCounts(db);
    assert.equal(afterAutomationMutation.automation_controls, 1);
    assert.equal(afterAutomationMutation.grants, beforeAutomationMutation.grants);
    assert.equal(afterAutomationMutation.core_records, beforeAutomationMutation.core_records);
    assert.equal(afterAutomationMutation.semantic_state, beforeAutomationMutation.semantic_state);
    let automation = readProjectAutomationEffectiveStatusV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: projectA.project.project_id,
    });
    assert.equal(automation.status, "enabled");
    assert.equal(automation.control_revision, 1);
    assert.equal(admission(automation).status, "grant_required");
    assert.equal(admission(automation, { grantStatus: "ready" }).status, "eligible");
    assert.equal(admission(automation, { activeRunCount: 1 }).status, "active_run_limit");
    assert.equal(
      admission(automation, {
        candidateProjectId: projectB.project.project_id,
      }).status,
      "project_scope_mismatch",
    );
    assert.equal(
      admission(automation, { grantProjectId: projectB.project.project_id })
        .status,
      "project_scope_mismatch",
    );

    const staleFirstWrite = await routeMutation({
      action: "enable_automation",
      project_id: projectA.project.project_id,
      expected_active_project_id: projectA.project.project_id,
      expected_active_selection_revision: active.selection_revision,
      expected_control_revision: null,
    });
    assert.equal(staleFirstWrite.status, 409);
    assert.equal(staleFirstWrite.body.error_code, "automation_revision_conflict");
    const beforeInvalid = mutationSideEffectCounts(db);
    expectStoreError(
      () =>
        mutateProjectControlV01(db!, {
          workspace_id: workspace.workspace_id,
          project_id: projectA.project.project_id,
          action: "resume_automation",
          expected_active_project_id: projectA.project.project_id,
          expected_active_selection_revision: active.selection_revision,
          expected_control_revision: automation.control_revision,
        }),
      "automation_transition_invalid",
    );
    assert.deepEqual(mutationSideEffectCounts(db), beforeInvalid);

    for (const [action, expectedStatus, now] of [
      ["pause_automation", "paused", "2026-07-16T00:00:00.000Z"],
      ["resume_automation", "enabled", "2026-07-16T00:01:00.000Z"],
      ["disable_automation", "disabled", "2026-07-16T00:02:00.000Z"],
      ["enable_automation", "enabled", "2026-07-16T00:03:00.000Z"],
    ] as const) {
      const priorRevision: number = automation.control_revision!;
      const result = mutateProjectControlV01(
        db,
        {
          workspace_id: workspace.workspace_id,
          project_id: projectA.project.project_id,
          action,
          expected_active_project_id: projectA.project.project_id,
          expected_active_selection_revision: active.selection_revision,
          expected_control_revision: priorRevision,
        },
        { now: () => now },
      );
      automation = result.automation!;
      assert.equal(automation.status, expectedStatus);
      assert.equal(automation.control_revision, priorRevision + 1);
    }

    const policy = buildConservativeProjectAutomationPolicyV01({
      workspace_id: workspace.workspace_id,
      project_id: projectA.project.project_id,
    });
    for (const expansion of [
      { automatic_retry: true },
      { automatic_semantic_commit: true },
      { automatic_approval: true },
      { external_actions_authorized: true },
      { provider_or_model_use_authorized: true },
      { can_expand_own_authority: true },
      { can_increase_own_budget: true },
      { can_select_cross_project_work: true },
      { can_merge: true },
      { can_publish: true },
      { can_deploy: true },
      { can_self_modify: true },
    ]) {
      assert.equal(
        validateProjectAutomationPolicyV01(
          { ...policy, ...expansion },
          policy,
        ).valid,
        false,
      );
    }
    const persistedPolicy = db
      .prepare(
        `SELECT policy_json FROM vnext_project_automation_controls
         WHERE workspace_id = ? AND project_id = ?`,
      )
      .get(workspace.workspace_id, projectA.project.project_id) as {
      policy_json: string;
    };
    db.prepare(
      `UPDATE vnext_project_automation_controls SET policy_json = ?
       WHERE workspace_id = ? AND project_id = ?`,
    ).run(
      JSON.stringify({ ...policy, can_merge: true }),
      workspace.workspace_id,
      projectA.project.project_id,
    );
    expectStoreError(
      () =>
        readProjectAutomationEffectiveStatusV01(db!, {
          workspace_id: workspace.workspace_id,
          project_id: projectA.project.project_id,
        }),
      "automation_policy_invalid",
    );
    db.prepare(
      `UPDATE vnext_project_automation_controls SET policy_json = ?
       WHERE workspace_id = ? AND project_id = ?`,
    ).run(
      persistedPolicy.policy_json,
      workspace.workspace_id,
      projectA.project.project_id,
    );

    const perspectiveRevision = include.personal_perspective!.scope_revision!;
    let perspective = mutateProjectControlV01(
      db,
      {
        workspace_id: workspace.workspace_id,
        project_id: projectA.project.project_id,
        action: "exclude_personal_perspective",
        expected_active_project_id: projectA.project.project_id,
        expected_active_selection_revision: active.selection_revision,
        expected_control_revision: perspectiveRevision,
      },
      { now: () => "2026-07-16T00:04:00.000Z" },
    ).personal_perspective!;
    assert.equal(perspective.status, "excluded");
    const excludedGate = selectPersonalPerspectiveContextV01({
      workspace_id: workspace.workspace_id,
      project_id: projectA.project.project_id,
      scope: perspective,
      candidates: [candidateA],
    });
    assert.equal(excludedGate.selected_context.length, 0);
    assert.equal(excludedGate.excluded_context.length, 1);
    perspective = mutateProjectControlV01(
      db,
      {
        workspace_id: workspace.workspace_id,
        project_id: projectA.project.project_id,
        action: "include_personal_perspective",
        expected_active_project_id: projectA.project.project_id,
        expected_active_selection_revision: active.selection_revision,
        expected_control_revision: perspective.scope_revision,
      },
      { now: () => "2026-07-16T00:05:00.000Z" },
    ).personal_perspective!;
    assert.equal(perspective.status, "included");
    assert.equal(perspective.scope_revision, 3);

    active = selectActiveProjectV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: projectB.project.project_id,
      expected_project_id: projectA.project.project_id,
      expected_revision: active.selection_revision,
      now: "2026-07-16T00:06:00.000Z",
    });
    const staleActive = await routeMutation({
      action: "pause_automation",
      project_id: projectA.project.project_id,
      expected_active_project_id: projectA.project.project_id,
      expected_active_selection_revision: 1,
      expected_control_revision: automation.control_revision,
    });
    assert.equal(staleActive.status, 409);
    assert.equal(staleActive.body.error_code, "active_project_conflict");

    const enableB = mutateProjectControlV01(
      db,
      {
        workspace_id: workspace.workspace_id,
        project_id: projectB.project.project_id,
        action: "enable_automation",
        expected_active_project_id: projectB.project.project_id,
        expected_active_selection_revision: active.selection_revision,
        expected_control_revision: null,
      },
      { now: () => "2026-07-16T00:07:00.000Z" },
    ).automation!;
    const disabledB = mutateProjectControlV01(
      db,
      {
        workspace_id: workspace.workspace_id,
        project_id: projectB.project.project_id,
        action: "disable_automation",
        expected_active_project_id: projectB.project.project_id,
        expected_active_selection_revision: active.selection_revision,
        expected_control_revision: enableB.control_revision,
      },
      { now: () => "2026-07-16T00:08:00.000Z" },
    ).automation!;
    const excludedB = mutateProjectControlV01(
      db,
      {
        workspace_id: workspace.workspace_id,
        project_id: projectB.project.project_id,
        action: "exclude_personal_perspective",
        expected_active_project_id: projectB.project.project_id,
        expected_active_selection_revision: active.selection_revision,
        expected_control_revision: null,
      },
      { now: () => "2026-07-16T00:09:00.000Z" },
    ).personal_perspective!;
    assert.equal(disabledB.status, "disabled");
    assert.equal(excludedB.status, "excluded");
    assert.equal(
      readProjectAutomationEffectiveStatusV01(db, {
        workspace_id: workspace.workspace_id,
        project_id: projectA.project.project_id,
      }).status,
      "enabled",
    );
    assert.equal(
      readPersonalPerspectiveEffectiveScopeV01(db, {
        workspace_id: workspace.workspace_id,
        project_id: projectA.project.project_id,
      }).status,
      "included",
    );
    expectStoreError(
      () =>
        mutateProjectControlV01(db!, {
          workspace_id: "workspace:wrong",
          project_id: projectA.project.project_id,
          action: "pause_automation",
          expected_active_project_id: projectA.project.project_id,
          expected_active_selection_revision: active.selection_revision,
          expected_control_revision: automation.control_revision,
        }),
      "project_control_scope_conflict",
    );
    expectStoreError(
      () =>
        mutateProjectControlV01(db!, {
          workspace_id: workspace.workspace_id,
          project_id: "project:augnes",
          action: "enable_automation",
          expected_active_project_id: "project:augnes",
          expected_active_selection_revision: active.selection_revision,
          expected_control_revision: null,
        }),
      "project_control_project_not_found",
    );

    const homeAWhileBActive = await readProjectHomeProjectionV01(
      db,
      {
        workspace_id: workspace.workspace_id,
        project_id: projectA.project.project_id,
      },
      {
        now: () => "2026-07-16T00:10:00.000Z",
        read_root_availability: async () => "available",
      },
    );
    assert.equal(homeAWhileBActive.project_summary.is_active, false);
    assert.equal(homeAWhileBActive.automation.status, "enabled");
    assert.equal(homeAWhileBActive.personal_perspective.status, "included");
    assert.equal(JSON.stringify(homeAWhileBActive).includes("project-b-secret"), false);

    const wrongOrigin = await controlsPOST(
      routeRequest(
        {
          action: "include_personal_perspective",
          project_id: projectB.project.project_id,
          expected_active_project_id: projectB.project.project_id,
          expected_active_selection_revision: active.selection_revision,
          expected_control_revision: excludedB.scope_revision,
        },
        { origin: "https://evil.example" },
      ),
    );
    assert.equal(wrongOrigin.status, 403);
    const nonLoopback = await controlsPOST(
      routeRequest(
        {
          action: "include_personal_perspective",
          project_id: projectB.project.project_id,
          expected_active_project_id: projectB.project.project_id,
          expected_active_selection_revision: active.selection_revision,
          expected_control_revision: excludedB.scope_revision,
        },
        {
          url: "http://example.test/api/vnext/project-controls",
          host: "example.test",
          origin: "http://example.test",
        },
      ),
    );
    assert.equal(nonLoopback.status, 403);
    assert.equal((await controlsGET()).status, 405);
    const malformed = await routeMutation({ action: "enable_automation" });
    assert.equal(malformed.status, 400);
    assert.equal(JSON.stringify(malformed.body).includes("stack"), false);
    const oversizedPath = path.join(root, "must-not-open.db");
    process.env.AUGNES_DB_PATH = oversizedPath;
    const oversized = await controlsPOST(
      new Request("http://127.0.0.1:3100/api/vnext/project-controls", {
        method: "POST",
        headers: {
          host: "127.0.0.1:3100",
          origin: "http://127.0.0.1:3100",
          "content-type": "application/json",
        },
        body: JSON.stringify({ padding: "x".repeat(80_000) }),
      }),
    );
    assert.equal(oversized.status, 413);
    assert.equal(existsSync(oversizedPath), false);
    process.env.AUGNES_DB_PATH = dbPath;

    active = selectActiveProjectV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: projectA.project.project_id,
      expected_project_id: projectB.project.project_id,
      expected_revision: active.selection_revision,
      now: "2026-07-16T00:11:00.000Z",
    });
    const preRemovalControls = mutationSideEffectCounts(db);
    assert.equal(
      removeRecentProjectV01(db, {
        workspace_id: workspace.workspace_id,
        project_id: projectA.project.project_id,
        expected_project_id: projectA.project.project_id,
        expected_revision: active.selection_revision,
      }),
      true,
    );
    assert.deepEqual(mutationSideEffectCounts(db), preRemovalControls);
    touchRecentProjectV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: projectA.project.project_id,
      now: "2026-07-16T00:12:00.000Z",
    });
    active = selectActiveProjectV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: projectA.project.project_id,
      expected_project_id: null,
      expected_revision: null,
      now: "2026-07-16T00:13:00.000Z",
    });
    rebindCanonicalProjectLocalRootV01(
      db,
      {
        workspace_id: workspace.workspace_id,
        project_id: projectA.project.project_id,
        local_root: normalizeLocalProjectRootRefV01(recoveredARoot, {
          base_path: root,
        }),
      },
      { now: () => "2026-07-16T00:14:00.000Z" },
    );
    assert.equal(
      readProjectAutomationEffectiveStatusV01(db, {
        workspace_id: workspace.workspace_id,
        project_id: projectA.project.project_id,
      }).control_revision,
      automation.control_revision,
    );

    const beforeRestart = {
      automation: readProjectAutomationEffectiveStatusV01(db, {
        workspace_id: workspace.workspace_id,
        project_id: projectA.project.project_id,
      }),
      perspective: readPersonalPerspectiveEffectiveScopeV01(db, {
        workspace_id: workspace.workspace_id,
        project_id: projectA.project.project_id,
      }),
      counts: mutationSideEffectCounts(db),
    };
    db.close();
    db = openDatabase();
    assert.deepEqual(
      readProjectAutomationEffectiveStatusV01(db, {
        workspace_id: workspace.workspace_id,
        project_id: projectA.project.project_id,
      }),
      beforeRestart.automation,
    );
    assert.deepEqual(
      readPersonalPerspectiveEffectiveScopeV01(db, {
        workspace_id: workspace.workspace_id,
        project_id: projectA.project.project_id,
      }),
      beforeRestart.perspective,
    );
    assert.deepEqual(mutationSideEffectCounts(db), beforeRestart.counts);
    const restartedHome = await readProjectHomeProjectionV01(
      db,
      {
        workspace_id: workspace.workspace_id,
        project_id: projectA.project.project_id,
      },
      {
        now: () => "2026-07-16T00:15:00.000Z",
        read_root_availability: async () => "available",
      },
    );
    assert.equal(restartedHome.automation.status, "enabled");
    assert.equal(restartedHome.automation.admission_status, "grant_required");
    assert.equal(restartedHome.personal_perspective.status, "included");
    assert.equal(
      restartedHome.personal_perspective.eligible_selected_count,
      0,
      "expired packet material is not reported as currently eligible",
    );
    assert.equal(
      readActiveProjectSelectionV01(db, workspace.workspace_id)?.project_id,
      projectA.project.project_id,
    );
    const readOnlyBefore = mutationSideEffectCounts(db);
    await readProjectHomeProjectionV01(
      db,
      {
        workspace_id: workspace.workspace_id,
        project_id: projectA.project.project_id,
      },
      {
        now: () => "2026-07-16T00:15:00.000Z",
        read_root_availability: async () => "available",
      },
    );
    assert.deepEqual(mutationSideEffectCounts(db), readOnlyBefore);
    assert.equal(db.pragma("integrity_check", { simple: true }), "ok");
    assert.equal((db.pragma("foreign_key_check") as unknown[]).length, 0);

    console.log(
      JSON.stringify(
        {
          status: "pass",
          automation_default: "not_configured",
          automation_revision: beforeRestart.automation.control_revision,
          personal_perspective_default: "excluded_fail_closed",
          personal_perspective_revision:
            beforeRestart.perspective.scope_revision,
          policy_profile:
            beforeRestart.automation.policy_summary.profile,
          admission_enabled_without_grant: "grant_required",
          compiler_personal_perspective_selected: 1,
          cross_project_selected_context: 0,
          same_repository_project_independence: true,
          active_project_conflicts: true,
          stale_control_conflicts: true,
          restart_persistence: true,
          root_recovery_preserved_controls: true,
          read_only_row_changes: 0,
          control_rows_created: 4,
          grants_created_by_control_mutation: 0,
          runs_created_by_control_mutation: 0,
          semantic_rows_created_by_control_mutation: 0,
          network_calls: 0,
          model_calls: 0,
          git_processes: 0,
          mcp_processes: 0,
          codex_host_processes: 0,
          scheduler_processes: 0,
        },
        null,
        2,
      ),
    );
  } finally {
    if (db?.open) db.close();
    process.env = originalEnvironment;
    rmSync(root, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
