#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, renameSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import {
  buildBlankStateViewV01,
  ordinaryActionLabel,
  publicBlankStateTextV01,
} from "../lib/vnext/blank-state/blank-state-view";
import {
  loadBlankStateSourceV01,
} from "../lib/vnext/blank-state/blank-state-source";
import {
  getOrCreateCanonicalProjectForLocalRootV01,
  getOrCreateDefaultWorkspaceIdentityV01,
} from "../lib/vnext/persistence/project-identity-registry";
import {
  selectActiveProjectV01,
  touchRecentProjectV01,
} from "../lib/vnext/persistence/project-lifecycle-registry";
import type { BlankStateSourceV01 } from "../types/vnext/blank-state";
import type { ProjectHomeProjectionV01 } from "../types/vnext/project-home";
import type { RecentProjectEntryV01 } from "../types/vnext/project-onboarding";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";

const root = mkdtempSync(path.join(tmpdir(), "augnes-blank-state-"));
const dbPath = path.join(root, "blank-state.db");
const projectARoot = path.join(root, "Project A");
const projectBRoot = path.join(root, "Project B");
mkdirSync(projectARoot);
mkdirSync(projectBRoot);

function openDatabase() {
  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  applyCanonicalDatabaseMigrations(db);
  return db;
}

function source(
  projection: ProjectHomeProjectionV01 | null,
  overrides: Partial<BlankStateSourceV01> = {},
): BlankStateSourceV01 {
  return {
    route_mode: "canonical",
    requested_project_id: null,
    active_project_id: projection?.project_summary.active_selection?.project_id ?? null,
    recent_projects: [],
    projection,
    project_resolution: projection ? "resolved" : "none",
    direct_host_round_trip_available: false,
    ...overrides,
  };
}

function projection(overrides: {
  active?: boolean;
  root?: ProjectHomeProjectionV01["project_summary"]["root_availability"];
  run?: ProjectHomeProjectionV01["run_results"]["current_run"];
  result?: ProjectHomeProjectionV01["run_results"]["latest_result"];
  entry?: ProjectHomeProjectionV01["run_results"]["workbench_entry"];
  attention?: ProjectHomeProjectionV01["attention"]["items"];
  goal?: string | null;
} = {}): ProjectHomeProjectionV01 {
  const active = overrides.active ?? true;
  return {
    workspace_id: "workspace:test",
    project_id: "project:test",
    project_summary: {
      project: { project_id: "project:test", display_name: "Test Project" },
      root_availability: overrides.root ?? "available",
      is_active: active,
      active_selection: active
        ? { project_id: "project:test", selection_revision: 3 }
        : { project_id: "project:other", selection_revision: 4 },
    },
    coordination: { task_frame: { goal: overrides.goal ?? null } },
    run_results: {
      current_run: overrides.run ?? null,
      latest_result: overrides.result ?? null,
      workbench_entry: overrides.entry ?? null,
    },
    attention: { items: overrides.attention ?? [] },
    recent_activity: { items: [] },
  } as unknown as ProjectHomeProjectionV01;
}

function recentEntry(overrides: Partial<RecentProjectEntryV01> = {}): RecentProjectEntryV01 {
  return {
    recent_project_entry_version: "recent_project_entry.v0.1",
    project: {
      project_identity_version: "project_identity.v0.1",
      identity_kind: "canonical",
      identity_source: "canonical_registry",
      workspace_id: "workspace:test",
      project_id: "project:test",
      display_name: "Recent Project",
      created_at: "2026-07-23T00:00:00.000Z",
    },
    local_root: {
      local_root_ref_version: "local_project_root_ref.v0.1",
      ref_kind: "local_project_root",
      path_flavor: "posix",
      normalized_path: "/public-test-path",
    },
    root_availability: "available",
    created_at: "2026-07-23T00:00:00.000Z",
    last_opened_at: "2026-07-23T00:00:00.000Z",
    is_active: false,
    active_project_id: null,
    active_selection_revision: null,
    ...overrides,
  };
}

async function main() {
  const noProjects = buildBlankStateViewV01(source(null));
  assert.equal(noProjects.focus, "no_projects");
  assert.deepEqual(noProjects.primary_action, {
    kind: "choose_folder",
    label: "Choose a local project",
  });

  const recent = recentEntry();
  const projectChoice = buildBlankStateViewV01(source(null, {
    recent_projects: [recent],
  }));
  assert.equal(projectChoice.focus, "project_choice");
  assert.equal(projectChoice.primary_action.kind, "open_recent");

  const unavailableActive = buildBlankStateViewV01(source(null, {
    active_project_id: recent.project.project_id,
    recent_projects: [{ ...recent, is_active: true, active_project_id: recent.project.project_id }],
    project_resolution: "unavailable",
  }));
  assert.equal(unavailableActive.focus, "project_choice");
  assert.equal(unavailableActive.primary_action.kind, "open_recent");
  assert.match(unavailableActive.situation, /record is safe/u);
  assert.equal(unavailableActive.semantic_authority_granted, false);

  const inactive = buildBlankStateViewV01(source(projection({ active: false })));
  assert.equal(inactive.focus, "viewed_project_inactive");
  assert.equal(inactive.primary_action.kind, "make_active");

  const missingRoot = buildBlankStateViewV01(source(projection({ root: "missing" }), {
    recent_projects: [recentEntry({ root_availability: "missing", is_active: true })],
  }));
  assert.equal(missingRoot.focus, "project_root_unavailable");
  assert.equal(missingRoot.primary_action.kind, "locate_folder");

  const running = buildBlankStateViewV01(source(projection({
    goal: "Finish the bounded work",
    run: {
      run_ref: "run:test",
      status: "running",
      mode: "interactive",
      started_at: "2026-07-23T00:00:00.000Z",
      updated_at: "2026-07-23T00:01:00.000Z",
      public_reason: null,
      reconciliation_required: false,
      packet_ref: null,
      receipt_available: false,
    },
  })));
  assert.equal(running.focus, "work_in_progress");
  assert.equal(running.primary_action.kind, "link");

  const resultEntry = {
    entry_version: "semantic_workbench_entry.v0.1",
    workspace_id: "workspace:test",
    project_id: "project:test",
    origin: "interactive",
    href: "/workbench/semantic-review/results/result:test",
    action_label: "Review result",
    reason: "Review",
    review_required: true,
    server_scope_validation_required: true,
    projection_only: true,
    semantic_authority_granted: false,
    entry_state: "assessment",
    source: { record_kind: "run_receipt", record_id: "receipt:test" },
  } as const;
  const resultReady = buildBlankStateViewV01(source(projection({
    result: {
      receipt_ref: "receipt:test",
      run_ref: "run:test",
      outcome: "completed",
      execution_status: "completed",
      verification_status: "partial",
      recorded_at: "2026-07-23T00:02:00.000Z",
      started_at: "2026-07-23T00:00:00.000Z",
      finished_at: "2026-07-23T00:02:00.000Z",
      summary: "RunReceipt saved; CriterionAssessment found one gap.",
      changed_file_count: 1,
      artifact_count: 1,
      command_count: 1,
      action_count: 1,
      check_counts: { passed: 2, failed: 0, blocked: 0, unknown: 0, skipped: 1 },
      blocker_count: 0,
      gap_count: 1,
      trust_label: "observed",
      review_attention: "verification_partial",
      review_href: resultEntry.href,
      inspector_href: "/workbench/inspector?target=result",
      mode: "interactive",
    },
    entry: resultEntry,
  })));
  assert.equal(resultReady.focus, "result_ready");
  assert.equal(resultReady.primary_action.kind, "link");
  assert.equal(resultReady.primary_action.label, "Review result");
  assert.equal(resultReady.situation.includes("RunReceipt"), false);
  assert.equal(resultReady.situation.includes("CriterionAssessment"), false);
  assert.deepEqual(resultReady.current_work?.verification, { passed: 2, failed: 0, skipped: 1 });

  const attention = buildBlankStateViewV01(source(projection({
    attention: [{
      attention_id: "attention:test",
      summary: "ReviewDecision is waiting",
      reason: "Transition remains blocked",
      workbench_entry: null,
      action_href: "/workbench/semantic-review",
      action_label: "Continue",
    }] as ProjectHomeProjectionV01["attention"]["items"],
  })));
  assert.equal(attention.focus, "attention_required");
  assert.equal(attention.situation.includes("ReviewDecision"), false);
  assert.equal(attention.material_note?.includes("Transition"), false);

  const idle = buildBlankStateViewV01(source(projection()));
  assert.equal(idle.focus, "ready_to_continue");
  assert.equal(idle.primary_action.kind, "link");
  assert.equal(idle.projection_only, true);
  assert.equal(idle.semantic_authority_granted, false);

  assert.equal(ordinaryActionLabel("pending_proposal"), "Review suggested change");
  assert.equal(ordinaryActionLabel("transition_applied"), "See what changed");
  assert.equal(
    publicBlankStateTextV01("TaskContextPacket, packet fingerprint, and lineage"),
    "work instructions, source check, and source history",
  );

  let successClosed = 0;
  const closableSuccess = { close: () => { successClosed += 1; } } as unknown as Database.Database;
  await loadBlankStateSourceV01(
    { route_mode: "canonical" },
    {
      open_database: () => closableSuccess,
      read_source: async () => source(null),
    },
  );
  assert.equal(successClosed, 1);

  let failureClosed = 0;
  const closableFailure = { close: () => { failureClosed += 1; } } as unknown as Database.Database;
  await assert.rejects(
    loadBlankStateSourceV01(
      { route_mode: "canonical" },
      {
        open_database: () => closableFailure,
        read_source: async () => { throw new Error("bounded source failure"); },
      },
    ),
    /bounded source failure/u,
  );
  assert.equal(failureClosed, 1);

  const emptyRoot = await loadBlankStateSourceV01(
    { route_mode: "canonical" },
    { open_database: openDatabase },
  );
  assert.equal(emptyRoot.project_resolution, "none");
  assert.equal(emptyRoot.recent_projects.length, 0);

  const db = openDatabase();
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db, {
    now: () => "2026-07-23T01:00:00.000Z",
    create_uuid: () => "00000000-0000-4000-8000-000000000001",
  });
  const projectA = getOrCreateCanonicalProjectForLocalRootV01(db, {
    workspace_id: workspace.workspace_id,
    local_root: {
      local_root_ref_version: "local_project_root_ref.v0.1",
      ref_kind: "local_project_root",
      path_flavor: "posix",
      normalized_path: projectARoot,
    },
    display_name: "Project A",
  }, {
    now: () => "2026-07-23T01:00:01.000Z",
    create_uuid: () => "00000000-0000-4000-8000-00000000000a",
  });
  const projectB = getOrCreateCanonicalProjectForLocalRootV01(db, {
    workspace_id: workspace.workspace_id,
    local_root: {
      local_root_ref_version: "local_project_root_ref.v0.1",
      ref_kind: "local_project_root",
      path_flavor: "posix",
      normalized_path: projectBRoot,
    },
    display_name: "Project B",
  }, {
    now: () => "2026-07-23T01:00:02.000Z",
    create_uuid: () => "00000000-0000-4000-8000-00000000000b",
  });
  touchRecentProjectV01(db, { workspace_id: workspace.workspace_id, project_id: projectA.project.project_id, now: "2026-07-23T01:00:03.000Z" });
  touchRecentProjectV01(db, { workspace_id: workspace.workspace_id, project_id: projectB.project.project_id, now: "2026-07-23T01:00:04.000Z" });
  selectActiveProjectV01(db, {
    workspace_id: workspace.workspace_id,
    project_id: projectA.project.project_id,
    now: "2026-07-23T01:00:05.000Z",
    expected_project_id: null,
    expected_revision: null,
  });
  db.close();

  const canonical = await loadBlankStateSourceV01({ route_mode: "canonical" }, { open_database: openDatabase });
  assert.equal(canonical.projection?.project_id, projectA.project.project_id);
  assert.equal(canonical.route_mode, "canonical");

  const management = await loadBlankStateSourceV01({ route_mode: "project_management" }, { open_database: openDatabase });
  assert.equal(management.projection?.project_id, projectA.project.project_id);
  assert.equal(management.recent_projects.length, 2);

  const viewedActive = await loadBlankStateSourceV01({ route_mode: "viewed_project", requested_project_id: projectA.project.project_id }, { open_database: openDatabase });
  assert.equal(viewedActive.projection?.project_summary.is_active, true);
  const viewedInactive = await loadBlankStateSourceV01({ route_mode: "viewed_project", requested_project_id: projectB.project.project_id }, { open_database: openDatabase });
  assert.equal(viewedInactive.projection?.project_summary.is_active, false);
  const invalid = await loadBlankStateSourceV01({ route_mode: "viewed_project", requested_project_id: "project:missing" }, { open_database: openDatabase });
  assert.equal(invalid.project_resolution, "not_found");

  renameSync(projectARoot, `${projectARoot}-moved`);
  const missing = await loadBlankStateSourceV01({ route_mode: "canonical" }, { open_database: openDatabase });
  assert.equal(missing.projection?.project_summary.root_availability, "missing");

  console.log(JSON.stringify({
    assertions: 32,
    blank_state_focuses: [
      "no_projects",
      "project_choice",
      "viewed_project_inactive",
      "project_root_unavailable",
      "work_in_progress",
      "result_ready",
      "attention_required",
      "ready_to_continue",
    ],
    source_routes: ["canonical", "project_management", "viewed_project"],
    semantic_authority_granted: false,
  }));
}

main()
  .finally(() => rmSync(root, { recursive: true, force: true }))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
