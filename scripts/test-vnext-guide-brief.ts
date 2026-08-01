#!/usr/bin/env node

import assert from "node:assert/strict";

import type Database from "better-sqlite3";

import {
  bindGuideBriefCodexProjectionToPacketV02,
  buildTaskStartGuideBriefCodexProjectionV02,
  buildProjectGuideBriefV02,
  unavailableGuideBriefCodexProjectionV02,
} from "../lib/vnext/guide-brief/project-guide-brief";
import { loadProjectGuideBriefV02 } from "../lib/vnext/guide-brief/project-guide-brief-source";
import {
  GUIDE_BRIEF_ACCESS_POLICY_V02,
  validateProjectGuideBriefReadRequestV02,
} from "../lib/vnext/guide-brief/project-guide-brief-route";
import type { BlankStateSourceV01 } from "../types/vnext/blank-state";
import type { ProjectHomeProjectionV01 } from "../types/vnext/project-home";
import type { TaskContextPacketV01 } from "../types/vnext/task-context-packet";

const NOW = "2026-07-23T00:00:00.000Z";
const PROJECT_ID = "project:00000000-0000-4000-8000-000000000001";
const OTHER_PROJECT_ID = "project:00000000-0000-4000-8000-000000000002";

function projection(overrides: {
  active?: boolean;
  root?: ProjectHomeProjectionV01["project_summary"]["root_availability"];
  run?: ProjectHomeProjectionV01["run_results"]["current_run"];
  result?: ProjectHomeProjectionV01["run_results"]["latest_result"];
  entry?: ProjectHomeProjectionV01["run_results"]["workbench_entry"];
  attention?: ProjectHomeProjectionV01["attention"]["items"];
  attentionTotalCount?: number;
  goal?: string | null;
} = {}): ProjectHomeProjectionV01 {
  const active = overrides.active ?? true;
  const attentionItems = overrides.attention ?? [];
  return {
    workspace_id: "workspace:00000000-0000-4000-8000-000000000001",
    project_id: PROJECT_ID,
    generated_at: NOW,
    project_summary: {
      project: { project_id: PROJECT_ID, display_name: "Current project" },
      root_availability: overrides.root ?? "available",
      is_active: active,
      active_selection: active ? { project_id: PROJECT_ID, selection_revision: 1 } : { project_id: OTHER_PROJECT_ID, selection_revision: 2 },
    },
    coordination: {
      task_frame: {
        goal:
          "goal" in overrides
            ? (overrides.goal ?? null)
            : "Ship the bounded current-project guide",
        success_criteria: ["Browser and Codex agree"],
        non_goals: ["Do not redesign AI Workplane"],
        required_checks: ["npm run typecheck"],
        forbidden_actions: ["Do not approve automatically"],
        tensions: [],
        risks: ["User judgment must remain unresolved"],
        gaps: [],
      },
    },
    run_results: {
      current_run: overrides.run ?? null,
      latest_result: overrides.result ?? null,
      workbench_entry: overrides.entry ?? null,
    },
    attention: {
      state: {
        section_state_version: "project_home_section_state.v0.1",
        status: attentionItems.length > 0 ? "action_required" : "empty",
        message:
          attentionItems.length > 0
            ? "Consequential project attention is available."
            : "No project attention currently needs review.",
      },
      total_count: overrides.attentionTotalCount ?? attentionItems.length,
      decision_debt: {
        pending_candidate_count: 0,
        accepted_awaiting_transition_count: 0,
        deferred_candidate_count: 0,
      },
      items: attentionItems,
    },
    recent_activity: { items: [{ summary: "Guide path updated", occurred_at: NOW, workbench_entry: null }] },
  } as unknown as ProjectHomeProjectionV01;
}

function source(project: ProjectHomeProjectionV01 | null, overrides: Partial<BlankStateSourceV01> = {}): BlankStateSourceV01 {
  return {
    route_mode: "canonical",
    requested_project_id: null,
    active_project_id: project?.project_summary.is_active ? PROJECT_ID : OTHER_PROJECT_ID,
    recent_projects: [],
    projection: project,
    project_resolution: project ? "resolved" : "none",
    direct_host_round_trip_available: false,
    delegated_work: null,
    ...overrides,
  };
}

function build(value: BlankStateSourceV01) {
  return buildProjectGuideBriefV02({ source: value, generated_at: NOW });
}

function waitingDelegatedWork(): NonNullable<BlankStateSourceV01["delegated_work"]> {
  return {
    projection_version: "delegated_work_projection.v0.1",
    workspace_id: "workspace:00000000-0000-4000-8000-000000000001",
    project_id: PROJECT_ID,
    run_ref: "autonomy-run:00000000-0000-4000-8000-000000000001",
    mode: "interactive",
    source_status: "available",
    stage: "waiting_for_approval",
    started_at: NOW,
    updated_at: NOW,
    finished_at: null,
    current: {
      goal: "Ship the bounded current-project guide",
      stage_label: "Waiting for your approval",
      situation: "Codex needs a bounded permission decision before it can continue.",
      latest_checkpoint: "Running a project command",
      material_blocker_or_request: "A project command needs your approval.",
      reconciliation_required: false,
      last_observed_at: NOW,
      trusted_result_available: false,
      needs_user: true,
    },
    timeline: [],
    compacted_item_count: 0,
    gap_notes: [],
    next_action: {
      kind: "review_requested_access",
      label: "Review requested access",
      href: "/workbench/semantic-review#delegated-work",
      executes: false,
    },
    pending_approval: null,
    result: null,
    exact_detail_href: null,
    start_eligible: false,
    start_blocker: "A run is already active.",
    control_revision: 3,
    can_cancel: true,
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

function resultProjection() {
  const entry = {
    entry_version: "semantic_workbench_entry.v0.1",
    workspace_id: "workspace:00000000-0000-4000-8000-000000000001",
    project_id: PROJECT_ID,
    origin: "interactive",
    href: "/workbench/results/run-receipt~000000000000000000000001",
    action_label: "Review result",
    reason: "Review the saved result",
    review_required: true,
    server_scope_validation_required: true,
    projection_only: true,
    semantic_authority_granted: false,
    entry_state: "assessment",
    source: { record_kind: "run_receipt", record_id: "run-receipt:000000000000000000000001" },
  } as const;
  return projection({
    result: {
      receipt_ref: "run-receipt:000000000000000000000001",
      run_ref: "run:000000000000000000000001",
      outcome: "completed",
      execution_status: "completed",
      verification_status: "partial",
      recorded_at: NOW,
      started_at: NOW,
      finished_at: NOW,
      summary: "RunReceipt saved under /Users/private/project with OPENAI_API_KEY=secret-value.",
      changed_file_count: 1,
      artifact_count: 0,
      command_count: 1,
      action_count: 1,
      check_counts: { passed: 2, failed: 0, blocked: 0, unknown: 0, skipped: 1 },
      blocker_count: 0,
      gap_count: 1,
      trust_label: "observed",
      review_attention: "verification_partial",
      review_href: entry.href,
      inspector_href: "/workbench/inspector?target=result",
      mode: "interactive",
    },
    entry,
  });
}

function packet(): TaskContextPacketV01 {
  return {
    packet_id: "task-context-packet:000000000000000000000001",
    workspace_id: "workspace:00000000-0000-4000-8000-000000000001",
    project_id: PROJECT_ID,
    task: { goal: "Exact packet goal", success_criteria: ["Exact criterion"], non_goals: ["Exact non-goal"] },
    constraints: { required_checks: ["npm test"], forbidden_actions: ["Do not broaden scope"] },
    integrity: { fingerprint: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
  } as unknown as TaskContextPacketV01;
}

async function main() {
  const states = [
    [build(source(null)), "no_projects"],
    [build(source(null, { recent_projects: [{ project: { project_id: PROJECT_ID, display_name: "Recent" }, root_availability: "available" }] as BlankStateSourceV01["recent_projects"] })), "project_choice"],
    [build(source(projection({ active: false }), { route_mode: "viewed_project", requested_project_id: PROJECT_ID })), "viewed_project_inactive"],
    [build(source(projection({ root: "missing" }))), "project_root_unavailable"],
    [build(source(projection({ run: { run_ref: "run:test", status: "paused", mode: "interactive", started_at: NOW, updated_at: NOW, public_reason: null, reconciliation_required: true, packet_ref: null, receipt_available: false } }))), "work_requires_attention"],
    [build(source(projection({ run: { run_ref: "run:test", status: "running", mode: "interactive", started_at: NOW, updated_at: NOW, public_reason: null, reconciliation_required: false, packet_ref: null, receipt_available: false } }))), "work_in_progress"],
    [build(source(resultProjection())), "result_ready"],
    [build(source(projection({ attention: [{ attention_id: "attention:test", summary: "A decision is waiting", reason: "The next change needs user judgment", workbench_entry: null, action_href: "/workbench/semantic-review", action_label: "Review", priority: 1 }] as ProjectHomeProjectionV01["attention"]["items"] }))), "attention_required"],
    [build(source(projection({ goal: null }), { work_initialization: { initialization_version: "project_work_initialization.v0.1", workspace_id: "workspace:00000000-0000-4000-8000-000000000001", project_id: PROJECT_ID, state: "not_defined", reason: "zero_durable_work_history", active_project_id: PROJECT_ID, active_selection_revision: 1, current_work: null, current_packet: null, mutation_eligible: true, projection_only: true, semantic_authority_granted: false, execution_authority_granted: false } })), "first_work_not_defined"],
    [build(source(projection())), "ready_to_continue"],
  ] as const;

  for (const [guide, focus] of states) {
    assert.equal(guide.coordinate.focus, focus);
    assert.equal(guide.projections.blank_state.focus, focus);
    assert.equal(
      guide.projections.blank_state.primary_action?.label ??
        guide.projections.blank_state.highlighted_item.secondary_action?.label,
      guide.primary_guidance.label,
    );
    assert.equal(guide.projections.ai_workplane.recommended_review_focus, guide.primary_guidance.label);
    assert.equal(guide.projections.chatgpt.primary_guidance.label, guide.primary_guidance.label);
    assert.deepEqual(
      guide.projections.blank_state.highlighted_item.requires_human_attention,
      guide.coordinate.human_attention.required,
    );
    assert.deepEqual(
      guide.projections.ai_workplane.human_attention,
      guide.coordinate.human_attention,
    );
    assert.deepEqual(
      guide.projections.chatgpt.human_attention,
      guide.coordinate.human_attention,
    );
    assert.deepEqual(
      guide.projections.codex.human_attention,
      guide.coordinate.human_attention,
    );
    assert.equal(guide.authority.source_of_truth, false);
    assert.equal(guide.authority.can_approve, false);
    assert.equal(guide.authority.can_write_db, false);
    assert.equal(guide.safety.persisted, false);
  }

  const firstWorkGuide = states.find(([, focus]) => focus === "first_work_not_defined")![0];
  assert.equal(firstWorkGuide.coordinate.goal, null);
  assert.equal(firstWorkGuide.coordinate.human_attention.required, false);
  assert.equal(firstWorkGuide.primary_guidance.label, "Define first work");
  assert.equal(firstWorkGuide.primary_guidance.href, "/workbench/semantic-review#first-work");
  assert.equal(
    firstWorkGuide.projections.ai_workplane.recommended_review_focus,
    "Define first work",
  );

  const resultGuide = states[6][0];
  assert.equal(JSON.stringify(resultGuide).includes("/Users/private"), false);
  assert.equal(JSON.stringify(resultGuide).includes("secret-value"), false);
  assert.equal(resultGuide.coordinate.verification?.passed, 2);
  assert.equal(resultGuide.needs_user_judgment[0]?.resolved, false);
  assert.equal(resultGuide.projections.chatgpt.goal, resultGuide.coordinate.goal);
  assert.equal(resultGuide.projections.chatgpt.status, resultGuide.coordinate.work_status);
  assert.equal(resultGuide.projections.codex.current_goal, resultGuide.coordinate.goal);
  assert.equal(resultGuide.projections.codex.suggested_next_action, resultGuide.primary_guidance.label);
  assert.equal(resultGuide.projections.ai_workplane.recommended_review_focus, resultGuide.primary_guidance.label);
  assert.deepEqual(resultGuide.projections.chatgpt.constraints, resultGuide.projections.codex.constraints);
  assert.deepEqual(
    resultGuide.projections.ai_workplane.important_constraints,
    resultGuide.projections.chatgpt.constraints.slice(0, 3),
  );
  assert.deepEqual(
    resultGuide.projections.ai_workplane.unresolved_user_judgments,
    resultGuide.projections.chatgpt.needs_user_judgment.map(
      (item) => item.question,
    ),
  );
  assert.deepEqual(
    resultGuide.projections.chatgpt.needs_user_judgment.map(
      (item) => item.question,
    ),
    resultGuide.projections.codex.unresolved_user_judgments,
  );
  assert.equal(resultGuide.observed.length <= 8, true);
  assert.equal(resultGuide.inferred.length <= 4, true);
  assert.equal(resultGuide.suggested.length <= 3, true);
  assert.equal(resultGuide.needs_user_judgment.length <= 3, true);

  const delegatedGuide = build(
    source(projection(), { delegated_work: waitingDelegatedWork() }),
  );
  assert.equal(delegatedGuide.coordinate.delegated_work?.stage, "waiting_for_approval");
  assert.equal(
    delegatedGuide.projections.blank_state.highlighted_item.attention_category,
    "access_judgment",
  );
  assert.equal(
    delegatedGuide.projections.ai_workplane.delegated_work?.stage,
    "waiting_for_approval",
  );
  assert.equal(
    delegatedGuide.projections.chatgpt.delegated_work?.stage,
    "waiting_for_approval",
  );
  assert.equal(delegatedGuide.primary_guidance.label, "Review requested access");
  assert.equal(delegatedGuide.coordinate.human_attention.required, true);
  assert.equal(
    delegatedGuide.coordinate.human_attention.category,
    "access_judgment",
  );
  assert.equal(delegatedGuide.authority.can_approve, false);

  const runningGuide = states[5][0];
  assert.equal(runningGuide.coordinate.human_attention.required, false);
  assert.equal(runningGuide.coordinate.human_attention.category, null);
  assert.equal(
    runningGuide.projections.blank_state.primary_action,
    null,
  );
  assert.equal(
    runningGuide.projections.blank_state.highlighted_item.secondary_action
      ?.label,
    "View progress",
  );
  assert.equal(
    runningGuide.projections.codex.human_attention.authority_granted,
    false,
  );

  const deterministicA = build(source(resultProjection()));
  const deterministicB = build(source(resultProjection()));
  assert.deepEqual(deterministicA, deterministicB);
  assert.equal(new Set(deterministicA.source_refs.map((item) => item.ref_id)).size, deterministicA.source_refs.length);

  const exactPacket = packet();
  const before = JSON.stringify(exactPacket);
  const bound = bindGuideBriefCodexProjectionToPacketV02(resultGuide.projections.codex, exactPacket);
  assert.equal(JSON.stringify(exactPacket), before);
  assert.equal(bound.packet_binding?.packet_fingerprint, exactPacket.integrity.fingerprint);
  assert.deepEqual(bound.constraints, exactPacket.constraints.forbidden_actions);
  assert.deepEqual(bound.required_checks, exactPacket.constraints.required_checks);
  assert.equal(bound.guide_does_not_override_packet, true);
  const taskStart = buildTaskStartGuideBriefCodexProjectionV02({
    packet: exactPacket,
    project_name: "Current project",
  });
  assert.equal(taskStart.status, "available");
  assert.equal(taskStart.project_name, "Current project");
  assert.equal(taskStart.current_goal, exactPacket.task.goal);
  assert.deepEqual(taskStart.constraints, exactPacket.constraints.forbidden_actions);
  assert.deepEqual(taskStart.required_checks, exactPacket.constraints.required_checks);
  assert.equal(taskStart.packet_binding?.packet_fingerprint, exactPacket.integrity.fingerprint);
  assert.equal(taskStart.can_approve, false);
  assert.equal(JSON.stringify(exactPacket), before);
  const openQuestion = "Which naming detail should be revisited later?";
  const packetWithOpenQuestion = {
    ...exactPacket,
    current_projection: {
      projection_kind: "current_working_perspective",
      projection_only: true,
      canonical_state: false,
      perspective_ref: null,
      bounded_summary: "The exact work can proceed with one unresolved question.",
      as_of: NOW,
      items: [
        {
          item_kind: "open_question",
          summary: openQuestion,
          source_refs: ["source:ordinary-open-question"],
          external_refs: [],
          currentness: {
            status: "unknown",
            as_of: NOW,
            basis: "Context remains unresolved without blocking the task.",
            source_ref: null,
          },
        },
      ],
      source_refs: ["source:ordinary-open-question"],
      external_refs: [],
      currentness: {
        status: "unknown",
        as_of: NOW,
        basis: "The question is unresolved context.",
        source_ref: null,
      },
      warnings: [],
    },
  } as TaskContextPacketV01;
  const openQuestionTaskStart = buildTaskStartGuideBriefCodexProjectionV02({
    packet: packetWithOpenQuestion,
    project_name: "Current project",
  });
  assert.deepEqual(
    openQuestionTaskStart.unresolved_user_judgments,
    [openQuestion],
  );
  assert.equal(openQuestionTaskStart.human_attention.required, false);
  assert.equal(openQuestionTaskStart.human_attention.category, null);
  assert.equal(openQuestionTaskStart.human_attention.blocked_or_awaiting, null);
  assert.equal(
    openQuestionTaskStart.human_attention.recommended_next_step,
    "Follow the exact requested work and its required checks",
  );
  assert.equal(openQuestionTaskStart.human_attention.projection_only, true);
  assert.equal(openQuestionTaskStart.human_attention.authority_granted, false);
  assert.equal(openQuestionTaskStart.can_approve, false);
  assert.equal(openQuestionTaskStart.can_execute_codex, false);
  assert.equal(openQuestionTaskStart.can_grant_host_permission, false);
  assert.doesNotMatch(
    JSON.stringify(openQuestionTaskStart.human_attention),
    /approval|decision|Transition|blocking/u,
  );
  assert.deepEqual(
    runningGuide.projections.codex.human_attention,
    runningGuide.coordinate.human_attention,
  );
  const unavailable = unavailableGuideBriefCodexProjectionV02(exactPacket, "bounded failure");
  assert.equal(unavailable.status, "unavailable");
  assert.equal(unavailable.packet_binding?.packet_id, exactPacket.packet_id);

  const valid = validateProjectGuideBriefReadRequestV02(new Request(
    `http://localhost/api/augnes/read/guide-brief?scope=project%3Aaugnes&project_id=${encodeURIComponent(PROJECT_ID)}`,
    { headers: { "x-augnes-local-readonly": "guide-brief-v0.2" } },
  ));
  assert.equal(valid.ok, true);
  assert.equal(GUIDE_BRIEF_ACCESS_POLICY_V02.required_marker_value, "guide-brief-v0.2");
  for (const [url, code] of [
    ["http://localhost/api/augnes/read/guide-brief", "missing_scope"],
    ["http://localhost/api/augnes/read/guide-brief?scope=wrong", "invalid_scope"],
    ["http://localhost/api/augnes/read/guide-brief?scope=project%3Aaugnes&scope=project%3Aaugnes", "duplicate_query_key"],
    ["http://localhost/api/augnes/read/guide-brief?scope=project%3Aaugnes&extra=1", "unknown_query_key"],
    ["http://localhost/api/augnes/read/guide-brief?scope=project%3Aaugnes&project_id=project%3Abad", "project_id_invalid"],
  ] as const) {
    const checked = validateProjectGuideBriefReadRequestV02(new Request(url, { headers: { "x-augnes-local-readonly": "guide-brief-v0.2" } }));
    assert.equal(checked.ok, false);
    if (!checked.ok) assert.equal(checked.code, code);
  }
  const remote = validateProjectGuideBriefReadRequestV02(new Request(
    "https://example.com/api/augnes/read/guide-brief?scope=project%3Aaugnes",
    { headers: { "x-augnes-local-readonly": "guide-brief-v0.2" } },
  ));
  assert.equal(remote.ok, false);
  const missingMarker = validateProjectGuideBriefReadRequestV02(new Request(
    "http://localhost/api/augnes/read/guide-brief?scope=project%3Aaugnes",
  ));
  assert.equal(missingMarker.ok, false);
  if (!missingMarker.ok) assert.equal(missingMarker.code, "local_authorization_required");
  const legacyMarker = validateProjectGuideBriefReadRequestV02(new Request(
    "http://localhost/api/augnes/read/guide-brief?scope=project%3Aaugnes",
    { headers: { "x-augnes-local-readonly": "guide-brief-v0.1" } },
  ));
  assert.equal(legacyMarker.ok, false);
  const post = validateProjectGuideBriefReadRequestV02(new Request(
    "http://localhost/api/augnes/read/guide-brief?scope=project%3Aaugnes",
    { method: "POST", headers: { "x-augnes-local-readonly": "guide-brief-v0.2" } },
  ));
  assert.equal(post.ok, false);
  if (!post.ok) assert.equal(post.code, "method_not_allowed");
  const forwarded = validateProjectGuideBriefReadRequestV02(new Request(
    "http://localhost/api/augnes/read/guide-brief?scope=project%3Aaugnes",
    { headers: { "x-augnes-local-readonly": "guide-brief-v0.2", "x-forwarded-host": "example.com" } },
  ));
  assert.equal(forwarded.ok, false);
  const strictMissingIdentity = validateProjectGuideBriefReadRequestV02(new Request(
    "http://localhost/api/augnes/read/guide-brief?scope=project%3Aaugnes&strict_local_auth=1",
    { headers: { "x-augnes-local-readonly": "guide-brief-v0.2" } },
  ));
  assert.equal(strictMissingIdentity.ok, false);
  if (!strictMissingIdentity.ok) assert.equal(strictMissingIdentity.code, "missing_identity");
  const strictValid = validateProjectGuideBriefReadRequestV02(new Request(
    "http://localhost/api/augnes/read/guide-brief?scope=project%3Aaugnes&strict_local_auth=1",
    { headers: {
      "x-augnes-local-readonly": "guide-brief-v0.2",
      "x-augnes-local-operator-ref": "operator:local-dev",
      "x-augnes-local-workspace-ref": "workspace:local-dev",
      "x-augnes-local-project-scope": "project:augnes",
    } },
  ));
  assert.equal(strictValid.ok, true);

  let closedSuccess = 0;
  await loadProjectGuideBriefV02({}, {
    open_database: () => ({ close: () => { closedSuccess += 1; } }) as unknown as Database.Database,
    read_source: async () => source(null),
    now: () => NOW,
  });
  assert.equal(closedSuccess, 1);
  let closedFailure = 0;
  await assert.rejects(loadProjectGuideBriefV02({}, {
    open_database: () => ({ close: () => { closedFailure += 1; } }) as unknown as Database.Database,
    read_source: async () => { throw new Error("bounded failure"); },
    now: () => NOW,
  }), /bounded failure/u);
  assert.equal(closedFailure, 1);

  console.log(JSON.stringify({
    assertions: 130,
    guide_version: resultGuide.guide_version,
    tested_focuses: states.map(([, focus]) => focus),
    cross_surface_consistency: true,
    task_context_packet_unchanged: true,
    authority_granted: false,
  }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
