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
import { buildProjectGuideBriefV02 } from "../lib/vnext/guide-brief/project-guide-brief";
import {
  getOrCreateCanonicalProjectForLocalRootV01,
  getOrCreateDefaultWorkspaceIdentityV01,
} from "../lib/vnext/persistence/project-identity-registry";
import {
  selectActiveProjectV01,
  touchRecentProjectV01,
} from "../lib/vnext/persistence/project-lifecycle-registry";
import type { BlankStateSourceV01 } from "../types/vnext/blank-state";
import type {
  DelegatedWorkProjectionV01,
  DelegatedWorkStageV01,
} from "../types/vnext/delegated-work";
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
    delegated_work: null,
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
  recent?: ProjectHomeProjectionV01["recent_activity"]["items"];
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
    recent_activity: { items: overrides.recent ?? [] },
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

function delegatedWork(
  stage: DelegatedWorkStageV01,
): DelegatedWorkProjectionV01 {
  const resultReady = stage === "result_ready";
  return {
    projection_version: "delegated_work_projection.v0.1",
    workspace_id: "workspace:test",
    project_id: "project:test",
    run_ref: "autonomy-run:test",
    mode: "interactive",
    source_status: "available",
    stage,
    started_at: "2026-07-23T00:00:00.000Z",
    updated_at: "2026-07-23T00:01:00.000Z",
    finished_at: resultReady ? "2026-07-23T00:01:00.000Z" : null,
    current: {
      goal: "Finish the bounded work",
      stage_label:
        stage === "waiting_for_approval"
          ? "Waiting for your approval"
          : stage === "resume_required"
            ? "Interrupted"
            : resultReady
              ? "Result ready"
              : "Working",
      situation: "The current delegated work state is persisted.",
      latest_checkpoint: "Running a project command",
      material_blocker_or_request:
        stage === "waiting_for_approval"
          ? "A bounded project command needs review."
          : null,
      reconciliation_required: stage === "resume_required",
      last_observed_at: "2026-07-23T00:01:00.000Z",
      trusted_result_available: resultReady,
      needs_user:
        stage === "waiting_for_approval" ||
        stage === "resume_required" ||
        resultReady,
    },
    timeline: [],
    compacted_item_count: 0,
    gap_notes: [],
    next_action: {
      kind:
        stage === "waiting_for_approval"
          ? "review_requested_access"
          : stage === "resume_required"
            ? "resume_codex_work"
            : resultReady
              ? "review_result"
              : "open_ai_workplane",
      label: null,
      href: "/workbench/semantic-review#delegated-work",
      executes: false,
    },
    pending_approval: null,
    result: resultReady
      ? {
          receipt_ref: "run-receipt:test",
          outcome: "completed",
          review_href: "/workbench/results/run-receipt~test",
        }
      : null,
    exact_detail_href: null,
    start_eligible: false,
    start_blocker: "A delegated run is active.",
    control_revision: 2,
    can_cancel: stage === "working" || stage === "waiting_for_approval",
    authority: {
      writes_database: false,
      creates_run: false,
      starts_codex: false,
      approves_host_action: false,
      cancels_run: false,
      resumes_run: false,
      creates_result: false,
      establishes_task_success: false,
      creates_evidence: false,
      changes_project_state: false,
      calls_provider: false,
      calls_github: false,
      retries: false,
    },
  };
}

function view(sourceValue: BlankStateSourceV01) {
  const guide = buildProjectGuideBriefV02({
    source: sourceValue,
    generated_at: "2026-07-23T00:00:00.000Z",
  });
  return buildBlankStateViewV01(guide);
}

async function main() {
  const noProjects = view(source(null));
  assert.equal(noProjects.focus, "no_projects");
  assert.equal(noProjects.attention_count, 0);
  assert.equal(noProjects.highlighted_item.source_family, "project_lifecycle");
  assert.deepEqual(noProjects.primary_action, {
    kind: "choose_folder",
    label: "Choose a local project",
  });

  const recent = recentEntry();
  const projectChoice = view(source(null, {
    recent_projects: [recent],
  }));
  assert.equal(projectChoice.focus, "project_choice");
  assert.equal(projectChoice.primary_action?.kind, "open_recent");

  const unavailableActive = view(source(null, {
    active_project_id: recent.project.project_id,
    recent_projects: [{ ...recent, is_active: true, active_project_id: recent.project.project_id }],
    project_resolution: "unavailable",
  }));
  assert.equal(unavailableActive.focus, "project_choice");
  assert.equal(unavailableActive.primary_action?.kind, "open_recent");
  assert.equal(unavailableActive.attention_count, 1);
  assert.equal(unavailableActive.highlighted_item.attention_category, "project_recovery");
  assert.match(unavailableActive.situation, /record is safe/u);
  assert.equal(unavailableActive.semantic_authority_granted, false);

  const inactive = view(source(projection({ active: false })));
  assert.equal(inactive.focus, "viewed_project_inactive");
  assert.equal(inactive.primary_action?.kind, "make_active");
  assert.equal(inactive.highlighted_item.attention_category, "project_activation");

  const missingRoot = view(source(projection({ root: "missing" }), {
    recent_projects: [recentEntry({ root_availability: "missing", is_active: true })],
  }));
  assert.equal(missingRoot.focus, "project_root_unavailable");
  assert.equal(missingRoot.primary_action?.kind, "locate_folder");
  assert.equal(missingRoot.attention_count, 1);

  const running = view(source(projection({
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
  assert.equal(running.primary_action, null);
  assert.equal(running.attention_count, 0);
  assert.equal(running.highlighted_item.secondary_action?.label, "View progress");

  const delegatedWaiting = view(
    source(projection(), {
      delegated_work: delegatedWork("waiting_for_approval"),
    }),
  );
  assert.equal(delegatedWaiting.focus, "work_requires_attention");
  assert.equal(
    delegatedWaiting.primary_action?.label,
    "Review requested access",
  );
  assert.equal(
    delegatedWaiting.highlighted_item.attention_category,
    "access_judgment",
  );
  assert.equal(delegatedWaiting.attention_count, 1);
  const delegatedResume = view(
    source(projection(), {
      delegated_work: delegatedWork("resume_required"),
    }),
  );
  assert.equal(delegatedResume.primary_action?.label, "Resume in AI Workplane");
  assert.equal(delegatedResume.highlighted_item.attention_category, "explicit_resume");
  const delegatedWorking = view(
    source(projection(), { delegated_work: delegatedWork("working") }),
  );
  assert.equal(delegatedWorking.heading, "Codex is working");
  assert.equal(delegatedWorking.primary_action, null);
  assert.equal(delegatedWorking.attention_count, 0);

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
  const latestResult = {
    receipt_ref: "receipt:test",
    run_ref: "run:test",
    outcome: "completed",
    execution_status: "completed",
    verification_status: "partial",
    recorded_at: "2026-07-23T00:02:00.000Z",
    started_at: "2026-07-23T00:00:00.000Z",
    finished_at: "2026-07-23T00:02:00.000Z",
    summary: "The bounded work completed with one open question.",
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
  } as const;
  const resultReady = view(source(projection({
    result: latestResult,
    entry: resultEntry,
  })));
  assert.equal(resultReady.focus, "result_ready");
  assert.equal(resultReady.primary_action?.kind, "link");
  assert.equal(resultReady.primary_action?.label, "Review result");
  assert.equal(resultReady.attention_count, 1);
  assert.equal(resultReady.highlighted_item.attention_category, "result_review");
  assert.equal(resultReady.situation.includes("RunReceipt"), false);
  assert.equal(resultReady.situation.includes("CriterionAssessment"), false);
  assert.deepEqual(resultReady.highlighted_item.verification, { passed: 2, failed: 0, skipped: 1 });
  const delegatedResult = delegatedWork("result_ready");
  const delegatedReviewHref = delegatedResult.result!.review_href;
  const combinedResult = view(source(projection({
    result: { ...latestResult, review_href: delegatedReviewHref },
    entry: { ...resultEntry, href: delegatedReviewHref },
  }), { delegated_work: delegatedResult }));
  assert.equal(combinedResult.continuity_item_count, 1);
  assert.equal(
    combinedResult.highlighted_item.last_meaningful_change?.summary,
    latestResult.summary,
  );

  const attention = view(source(projection({
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
  assert.equal(attention.attention_count, 1);
  assert.equal(attention.highlighted_item.attention_category, "pending_review");
  assert.equal(attention.situation.includes("ReviewDecision"), false);
  assert.equal(attention.material_note?.includes("Transition"), false);

  const idle = view(source(projection()));
  assert.equal(idle.focus, "ready_to_continue");
  assert.equal(idle.primary_action?.kind, "link");
  assert.equal(idle.attention_count, 0);
  assert.equal(idle.projection_only, true);
  assert.equal(idle.semantic_authority_granted, false);

  for (const stage of ["preparing", "working", "cancelling"] as const) {
    const ordinary = view(
      source(projection(), { delegated_work: delegatedWork(stage) }),
    );
    assert.equal(ordinary.attention_count, 0, stage);
    assert.equal(ordinary.primary_action, null, stage);
    assert.equal(
      ordinary.highlighted_item.secondary_action?.label,
      "View progress",
      stage,
    );
  }

  const delegatedTrustedResult = view(
    source(projection(), { delegated_work: delegatedWork("result_ready") }),
  );
  assert.equal(delegatedTrustedResult.attention_count, 1);
  assert.equal(
    delegatedTrustedResult.highlighted_item.attention_category,
    "result_review",
  );
  assert.equal(
    delegatedTrustedResult.primary_action?.label,
    "Review result",
  );

  const reconciliation = view(source(projection({
    goal: "Reconcile the interrupted observation",
    run: {
      run_ref: "run:reconciliation",
      status: "paused",
      mode: "interactive",
      started_at: "2026-07-23T00:00:00.000Z",
      updated_at: "2026-07-23T00:03:00.000Z",
      public_reason: "Runtime ownership changed.",
      reconciliation_required: true,
      packet_ref: null,
      receipt_available: false,
    },
  })));
  assert.equal(reconciliation.attention_count, 1);
  assert.equal(
    reconciliation.highlighted_item.attention_category,
    "reconciliation",
  );
  assert.equal(reconciliation.primary_action?.label, "Review current work");

  const deferredBeforeDue = view(source(projection({
    goal: "Wait for the stated revisit condition",
    attention: [],
  })));
  assert.equal(deferredBeforeDue.attention_count, 0);
  assert.equal(deferredBeforeDue.focus, "ready_to_continue");

  const deferredNowDue = view(source(projection({
    attention: [{
      attention_id: "proposal:deferred-now-due",
      proposal_id: "proposal:deferred-now-due",
      summary: "A deferred decision is now due for review",
      created_at: "2026-07-23T00:04:00.000Z",
      pending_candidate_count: 1,
      priority: 40,
      signals: ["interactive"],
      reason: "Its exact revisit condition is now satisfied.",
      workbench_entry: null,
      action_href: "/workbench/semantic-review?proposal=deferred-now-due",
      action_label: "Review due decision",
      lineage: [],
    }],
  })));
  assert.equal(deferredNowDue.attention_count, 1);
  assert.equal(
    deferredNowDue.highlighted_item.attention_category,
    "pending_review",
  );

  const settledTransition = view(source(projection({
    attention: [{
      attention_id: "proposal:settled",
      proposal_id: "proposal:settled",
      summary: "A settled change remains in history",
      created_at: "2026-07-23T00:04:00.000Z",
      pending_candidate_count: 0,
      priority: 1,
      signals: ["interactive"],
      reason: "The change was already applied.",
      workbench_entry: {
        entry_version: "semantic_workbench_entry.v0.1",
        workspace_id: "workspace:test",
        project_id: "project:test",
        origin: "interactive",
        href: "/workbench/semantic-review?proposal=settled",
        action_label: "See what changed",
        reason: "The change was already applied.",
        review_required: false,
        server_scope_validation_required: true,
        projection_only: true,
        semantic_authority_granted: false,
        entry_state: "transition_applied",
        source: {
          record_kind: "episode_delta_proposal",
          record_id: "proposal:settled",
        },
      },
      action_href: null,
      action_label: "See what changed",
      lineage: [],
    }],
  })));
  assert.equal(settledTransition.attention_count, 0);
  assert.equal(settledTransition.focus, "ready_to_continue");
  assert.equal(
    settledTransition.continuity_items[0]?.requires_human_attention,
    false,
  );

  const recentChange = view(source(projection({
    recent: [{
      activity_kind: "review_decision",
      summary: "The verification plan changed",
      occurred_at: "2026-07-23T00:05:00.000Z",
      outcome: "recorded",
      workbench_entry: null,
      lineage: [],
    }],
  })));
  assert.equal(recentChange.attention_count, 0);
  assert.equal(recentChange.highlighted_item.source_family, "continuation");
  assert.equal(
    recentChange.continuity_items[0]?.source_family,
    "recent_change",
  );

  const duplicateIntervention = view(source(projection({
    attention: [
      {
        attention_id: "proposal:duplicate-a",
        proposal_id: "proposal:duplicate-a",
        summary: "Review the bounded intervention",
        created_at: "2026-07-23T00:06:00.000Z",
        pending_candidate_count: 1,
        priority: 10,
        signals: ["blocked"],
        reason: "Safe continuation is blocked.",
        workbench_entry: null,
        action_href: "/workbench/semantic-review?intervention=one",
        action_label: "Review intervention",
        lineage: [],
      },
      {
        attention_id: "proposal:duplicate-b",
        proposal_id: "proposal:duplicate-b",
        summary: "The same intervention appears from another source",
        created_at: "2026-07-23T00:06:01.000Z",
        pending_candidate_count: 1,
        priority: 20,
        signals: ["interactive"],
        reason: "It has the same bounded destination.",
        workbench_entry: null,
        action_href: "/workbench/semantic-review?intervention=one",
        action_label: "Review intervention",
        lineage: [],
      },
    ],
  })));
  assert.equal(duplicateIntervention.attention_count, 1);
  assert.equal(duplicateIntervention.continuity_item_count, 1);
  assert.equal(duplicateIntervention.continuity_items.length, 0);

  const equalClassInputs = [
    {
      attention_id: "proposal:equal-a",
      proposal_id: "proposal:equal-a",
      summary: "Equal review A",
      created_at: "2026-07-23T00:07:00.000Z",
      pending_candidate_count: 1,
      priority: 30,
      signals: ["interactive" as const],
      reason: "A consequential review is pending.",
      workbench_entry: null,
      action_href: "/workbench/semantic-review?equal=a",
      action_label: "Review A",
      lineage: [],
    },
    {
      attention_id: "proposal:equal-b",
      proposal_id: "proposal:equal-b",
      summary: "Equal review B",
      created_at: "2026-07-23T00:07:00.000Z",
      pending_candidate_count: 1,
      priority: 30,
      signals: ["interactive" as const],
      reason: "A consequential review is pending.",
      workbench_entry: null,
      action_href: "/workbench/semantic-review?equal=b",
      action_label: "Review B",
      lineage: [],
    },
  ];
  const deterministicA = view(source(projection({
    attention: equalClassInputs,
  })));
  const deterministicB = view(source(projection({
    attention: [...equalClassInputs].reverse(),
  })));
  assert.deepEqual(
    [
      deterministicA.highlighted_item.item_id,
      ...deterministicA.continuity_items.map((item) => item.item_id),
    ],
    [
      deterministicB.highlighted_item.item_id,
      ...deterministicB.continuity_items.map((item) => item.item_id),
    ],
  );

  const bounded = view(source(projection({
    attention: Array.from({ length: 7 }, (_, index) => ({
      attention_id: `proposal:bounded-${index}`,
      proposal_id: `proposal:bounded-${index}`,
      summary: `Bounded review ${index}`,
      created_at: `2026-07-23T00:0${index}:00.000Z`,
      pending_candidate_count: 1,
      priority: 50,
      signals: ["interactive"] as const,
      reason: "A consequential review is pending.",
      workbench_entry: null,
      action_href: `/workbench/semantic-review?bounded=${index}`,
      action_label: `Review ${index}`,
      lineage: [],
    })),
  })));
  assert.equal(1 + bounded.continuity_items.length, 5);
  assert.equal(bounded.attention_count, 7);
  assert.equal(bounded.omitted_item_count, 2);

  const unavailableDelegated = view(source(projection(), {
    delegated_work: delegatedWork("unavailable"),
  }));
  assert.equal(unavailableDelegated.attention_count, 0);
  assert.equal(unavailableDelegated.primary_action, null);

  const terminalDelegated = view(source(projection(), {
    delegated_work: delegatedWork("failed"),
  }));
  assert.equal(terminalDelegated.attention_count, 0);
  assert.equal(terminalDelegated.primary_action, null);

  for (const composed of [
    noProjects,
    running,
    delegatedWaiting,
    delegatedTrustedResult,
    resultReady,
    bounded,
  ]) {
    assert.equal(
      composed.continuity_items.some(
        (item) => item.item_id === composed.highlighted_item.item_id,
      ),
      false,
    );
    assert.equal(composed.highlighted_item.projection_only, true);
    assert.equal(
      composed.highlighted_item.semantic_authority_granted,
      false,
    );
    assert.equal((composed.primary_action === null ? 0 : 1) <= 1, true);
  }

  const ordinaryPublicCopy = [
    resultReady.heading,
    resultReady.situation,
    resultReady.continuity_summary,
    resultReady.highlighted_item.work_name,
    resultReady.highlighted_item.meaningful_state,
    resultReady.highlighted_item.last_meaningful_change?.summary ?? "",
    resultReady.highlighted_item.consequential_detail ?? "",
  ].join(" ");
  assert.doesNotMatch(
    ordinaryPublicCopy,
    /TaskContextPacket|RunReceipt|CriterionAssessment|ReviewDecision|StateTransitionReceipt|packet fingerprint/u,
  );

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
    assertion_sites: 102,
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
